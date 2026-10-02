import { Injectable, computed, inject } from '@angular/core';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';

import { consultaEnVivo } from '../en-vivo';
import { ErrorConMensaje } from '../errores';
import { FIRESTORE } from '../firebase';
import { COL, ConId, Pulsera } from '../models';
import { AuthService } from './auth.service';

/** Cómo se identifica una pulsera: por el UID del chip o por su código (impreso o del enlace). */
export interface IdentificacionPulsera {
  uid?: string | null;
  codigo?: string | null;
}

/** Pulseras: vincular a una cuenta (RF-01) y dar de alta stickers nuevos. */
@Injectable({ providedIn: 'root' })
export class PulserasService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  private readonly mias = consultaEnVivo<Pulsera>(() => {
    const uid = this.auth.uid();
    return uid ? query(collection(this.db, COL.pulseras), where('usuarioId', '==', uid)) : null;
  });

  /** La pulsera del usuario. `undefined` = cargando, `null` = no tiene. */
  readonly miPulsera = computed(() => {
    const mias = this.mias();
    return mias === undefined ? undefined : (mias[0] ?? null);
  });

  /** Busca primero por UID del chip y, si no, por código. */
  async buscar({ uid, codigo }: IdentificacionPulsera): Promise<ConId<Pulsera> | null> {
    if (uid) {
      const snap = await getDoc(doc(this.db, COL.pulseras, uid));
      if (snap.exists()) {
        return { ...(snap.data() as Pulsera), id: snap.id };
      }
    }
    if (codigo) {
      const snap = await getDocs(
        query(collection(this.db, COL.pulseras), where('codigo', '==', codigo), limit(1)),
      );
      const encontrada = snap.docs[0];
      if (encontrada) {
        return { ...(encontrada.data() as Pulsera), id: encontrada.id };
      }
    }
    return null;
  }

  /**
   * Vincula la pulsera a la cuenta con sesión. Si el usuario ya tenía otra, la anterior
   * queda libre (ej. perdió la primera y le dieron una nueva).
   */
  async vincular(identificacion: IdentificacionPulsera): Promise<'vinculada' | 'ya_era_tuya'> {
    const usuarioId = this.auth.uid();
    if (!usuarioId) {
      throw new ErrorConMensaje('Inicia sesión para vincular tu pulsera.');
    }
    const pulsera = await this.buscar(identificacion);
    if (!pulsera) {
      throw new ErrorConMensaje('No encontramos esa pulsera. Revisa el código.');
    }
    if (pulsera.usuarioId === usuarioId) {
      return 'ya_era_tuya';
    }
    validarLibre(pulsera);

    const anteriores = await getDocs(
      query(collection(this.db, COL.pulseras), where('usuarioId', '==', usuarioId)),
    );
    await runTransaction(this.db, async (tx) => {
      const ref = doc(this.db, COL.pulseras, pulsera.id);
      const actual = await tx.get(ref);
      validarLibre(actual.data() as Pulsera);
      for (const anterior of anteriores.docs) {
        tx.update(anterior.ref, { usuarioId: null, vinculadaEn: null });
      }
      tx.update(ref, { usuarioId, vinculadaEn: Timestamp.now() });
    });
    return 'vinculada';
  }

  /**
   * Guarda un sticker nuevo (modo alta del lector, solo admin). El lector graba primero el
   * enlace con el código en el chip y luego llama aquí. Con 31^6 ≈ 887 millones de códigos
   * posibles, la probabilidad de repetir uno entre unas cuantas pulseras es despreciable.
   */
  async registrar(uidChip: string, codigo: string): Promise<void> {
    const pulsera: Pulsera = { codigo, usuarioId: null, estado: 'activa', vinculadaEn: null };
    await setDoc(doc(this.db, COL.pulseras, uidChip), pulsera);
  }
}

function validarLibre(pulsera: Pulsera): void {
  if (pulsera.estado === 'bloqueada') {
    throw new ErrorConMensaje('Esta pulsera está bloqueada. Acude a un módulo de información.');
  }
  if (pulsera.usuarioId) {
    throw new ErrorConMensaje('Esta pulsera ya está vinculada a otra cuenta.');
  }
}
