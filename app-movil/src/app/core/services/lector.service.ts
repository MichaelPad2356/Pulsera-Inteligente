import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';

import { ErrorConMensaje } from '../errores';
import { FIRESTORE } from '../firebase';
import { aplicarVisita, promocionVigente, Visita } from '../logica/promociones';
import {
  COL,
  ConId,
  Evento,
  Interaccion,
  Progreso,
  Promocion,
  Pulsera,
  Usuario,
} from '../models';
import { diaEnAgs } from '../utils/fechas';
import { IdentificacionPulsera, PulserasService } from './pulseras.service';

export interface CambioPromocion {
  promocionId: string;
  titulo: string;
  avance: number;
  meta: number;
  desbloqueada: boolean;
}

export type ResultadoVisita =
  | { tipo: 'registrada'; nombre: string; cambios: CambioPromocion[]; evento: string | null }
  | { tipo: 'repetida'; nombre: string };

export interface DatosCanje {
  nombre: string;
  promociones: ConId<Promocion>[];
}

/**
 * Lo que hace el celular del establecimiento al leer una pulsera (RF-07, RF-08):
 * registrar la visita y actualizar el progreso, o canjear una promoción.
 * Todo en transacciones de Firestore (no hay servidor propio).
 */
@Injectable({ providedIn: 'root' })
export class LectorService {
  private readonly db = inject(FIRESTORE);
  private readonly pulseras = inject(PulserasService);

  /** Id de la pulsera leída o escrita a mano. */
  async identificar(identificacion: IdentificacionPulsera): Promise<string> {
    const pulsera = await this.pulseras.buscar(identificacion);
    if (!pulsera) {
      throw new ErrorConMensaje('Pulsera no registrada en el sistema.');
    }
    return pulsera.id;
  }

  /**
   * Registra la visita (1 por lugar, por usuario, por día) y avanza todas las promociones
   * vigentes a las que cuenta. Si el lugar es un foro con evento hoy, cuenta como asistencia.
   */
  async registrarVisita(pulseraId: string, lugarId: string): Promise<ResultadoVisita> {
    const dia = diaEnAgs();
    const ahora = Timestamp.now();

    const [promosSnap, eventosSnap] = await Promise.all([
      getDocs(query(collection(this.db, COL.promociones), where('activa', '==', true))),
      getDocs(
        query(
          collection(this.db, COL.eventos),
          where('lugarId', '==', lugarId),
          where('fecha', '==', dia),
        ),
      ),
    ]);
    const promociones = promosSnap.docs
      .map((d) => ({ ...(d.data() as Promocion), id: d.id }))
      .filter((p) => promocionVigente(p, dia));
    const evento = eventosSnap.docs
      .map((d) => ({ ...(d.data() as Evento), id: d.id }))
      .sort((a, b) => a.hora.localeCompare(b.hora))[0];
    const visita: Visita = { lugarId, eventoId: evento?.id };

    return runTransaction(this.db, async (tx) => {
      const pulsera = await tx.get(doc(this.db, COL.pulseras, pulseraId));
      const usuarioId = validarPulsera(pulsera.exists() ? (pulsera.data() as Pulsera) : null);
      const usuario = await tx.get(doc(this.db, COL.usuarios, usuarioId));
      const nombre = primerNombre(usuario.data() as Usuario | undefined);

      const visitaRef = doc(this.db, COL.interacciones, `${usuarioId}_${lugarId}_${dia}`);
      if ((await tx.get(visitaRef)).exists()) {
        return { tipo: 'repetida', nombre };
      }

      // Todas las lecturas antes de cualquier escritura (regla de las transacciones).
      const progresoRefs = promociones.map((p) =>
        doc(this.db, COL.usuarios, usuarioId, COL.progreso, p.id),
      );
      const progresos = await Promise.all(progresoRefs.map((ref) => tx.get(ref)));

      const interaccion: Interaccion = {
        usuarioId,
        pulseraId,
        lugarId,
        tipo: 'visita',
        fechaHora: ahora,
        dia,
        ...(evento ? { eventoId: evento.id } : {}),
      };
      tx.set(visitaRef, interaccion);

      const cambios: CambioPromocion[] = [];
      promociones.forEach((promo, i) => {
        const actual = progresos[i].exists() ? (progresos[i].data() as Progreso) : null;
        const nuevo = aplicarVisita(promo, actual, visita, ahora);
        if (nuevo) {
          tx.set(progresoRefs[i], nuevo);
          cambios.push({
            promocionId: promo.id,
            titulo: promo.titulo,
            avance: nuevo.avance,
            meta: nuevo.meta,
            desbloqueada: nuevo.estado === 'desbloqueada',
          });
        }
      });
      return { tipo: 'registrada', nombre, cambios, evento: evento?.artista ?? null };
    });
  }

  /** Promociones desbloqueadas del dueño de la pulsera que se canjean en este lugar. */
  async paraCanje(pulseraId: string, lugarId: string): Promise<DatosCanje> {
    const pulsera = await getDoc(doc(this.db, COL.pulseras, pulseraId));
    const usuarioId = validarPulsera(pulsera.exists() ? (pulsera.data() as Pulsera) : null);
    const [usuario, desbloqueadas] = await Promise.all([
      getDoc(doc(this.db, COL.usuarios, usuarioId)),
      getDocs(
        query(
          collection(this.db, COL.usuarios, usuarioId, COL.progreso),
          where('estado', '==', 'desbloqueada'),
        ),
      ),
    ]);
    const promos = await Promise.all(
      desbloqueadas.docs.map((d) => getDoc(doc(this.db, COL.promociones, d.id))),
    );
    return {
      nombre: primerNombre(usuario.data() as Usuario | undefined),
      promociones: promos
        .filter((p) => p.exists() && (p.data() as Promocion).lugarId === lugarId)
        .map((p) => ({ ...(p.data() as Promocion), id: p.id })),
    };
  }

  /** Marca la promoción como utilizada y guarda el canje en el historial. */
  async canjear(pulseraId: string, promocionId: string, lugarId: string): Promise<void> {
    const ahora = Timestamp.now();
    await runTransaction(this.db, async (tx) => {
      const pulsera = await tx.get(doc(this.db, COL.pulseras, pulseraId));
      const usuarioId = validarPulsera(pulsera.exists() ? (pulsera.data() as Pulsera) : null);
      const promo = await tx.get(doc(this.db, COL.promociones, promocionId));
      if (!promo.exists() || (promo.data() as Promocion).lugarId !== lugarId) {
        throw new ErrorConMensaje('Esta promoción no se canjea en este lugar.');
      }
      const progresoRef = doc(this.db, COL.usuarios, usuarioId, COL.progreso, promocionId);
      const progreso = await tx.get(progresoRef);
      if ((progreso.data() as Progreso | undefined)?.estado !== 'desbloqueada') {
        throw new ErrorConMensaje('La promoción no está disponible para canje (¿ya se usó?).');
      }
      tx.update(progresoRef, { estado: 'utilizada', utilizadaEn: ahora });
      const canje: Interaccion = {
        usuarioId,
        pulseraId,
        lugarId,
        tipo: 'canje',
        promocionId,
        fechaHora: ahora,
        dia: diaEnAgs(),
      };
      tx.set(doc(collection(this.db, COL.interacciones)), canje);
    });
  }
}

function validarPulsera(pulsera: Pulsera | null): string {
  if (!pulsera) {
    throw new ErrorConMensaje('Pulsera no registrada en el sistema.');
  }
  if (pulsera.estado === 'bloqueada') {
    throw new ErrorConMensaje('Esta pulsera está bloqueada.');
  }
  if (!pulsera.usuarioId) {
    throw new ErrorConMensaje('Esta pulsera aún no está vinculada a ninguna cuenta.');
  }
  return pulsera.usuarioId;
}

function primerNombre(usuario: Usuario | undefined): string {
  return usuario?.nombre.split(' ')[0] ?? 'Visitante';
}
