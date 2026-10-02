import { Injectable, computed, inject } from '@angular/core';
import { collection } from 'firebase/firestore';

import { consultaEnVivo } from '../en-vivo';
import { FIRESTORE } from '../firebase';
import { Actividad, COL, ConId, Evento, Lugar, Promocion } from '../models';

/**
 * Contenido de la feria: lugares, actividades, eventos y promociones (RF-02 a RF-05, RF-08).
 * Son pocos documentos, así que se cargan completos y en vivo una sola vez; las pantallas
 * filtran y ordenan con `computed`.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly db = inject(FIRESTORE);

  private readonly todosLosLugares = consultaEnVivo<Lugar>(() => collection(this.db, COL.lugares));
  private readonly todasLasActividades = consultaEnVivo<Actividad>(() =>
    collection(this.db, COL.actividades),
  );
  private readonly todosLosEventos = consultaEnVivo<Evento>(() => collection(this.db, COL.eventos));
  private readonly todasLasPromociones = consultaEnVivo<Promocion>(() =>
    collection(this.db, COL.promociones),
  );

  /** Lugares activos, por nombre. `undefined` mientras carga. */
  readonly lugares = computed(() =>
    this.todosLosLugares()
      ?.filter((l) => l.activo)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  );

  /** Actividades culturales por fecha y hora. */
  readonly actividades = computed(() => this.todasLasActividades()?.slice().sort(porFechaYHora));

  /** Eventos y conciertos por fecha y hora. */
  readonly eventos = computed(() => this.todosLosEventos()?.slice().sort(porFechaYHora));

  /** Promociones activas (la vigencia se revisa en cada pantalla). */
  readonly promociones = computed(() => this.todasLasPromociones()?.filter((p) => p.activa));

  /** Para el panel: también los lugares y promociones desactivados. */
  readonly lugaresTodos = computed(() =>
    this.todosLosLugares()
      ?.slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  );
  readonly promocionesTodas = computed(() =>
    this.todasLasPromociones()
      ?.slice()
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es')),
  );

  readonly cargando = computed(
    () =>
      this.lugares() === undefined ||
      this.actividades() === undefined ||
      this.eventos() === undefined ||
      this.promociones() === undefined,
  );

  private readonly lugaresPorId = computed(
    () => new Map((this.todosLosLugares() ?? []).map((l) => [l.id, l])),
  );

  lugar(id: string | null | undefined): ConId<Lugar> | undefined {
    return id ? this.lugaresPorId().get(id) : undefined;
  }

  actividad(id: string): ConId<Actividad> | undefined {
    return this.todasLasActividades()?.find((a) => a.id === id);
  }

  evento(id: string): ConId<Evento> | undefined {
    return this.todosLosEventos()?.find((e) => e.id === id);
  }

  promocion(id: string): ConId<Promocion> | undefined {
    return this.todasLasPromociones()?.find((p) => p.id === id);
  }

  /** Promociones que otorga un lugar o que lo incluyen en su ruta (RF-03: "promociones, cuando aplique"). */
  promocionesDeLugar(lugarId: string): ConId<Promocion>[] {
    return (this.promociones() ?? []).filter(
      (p) =>
        p.lugarId === lugarId || (p.regla.tipo === 'lugares' && p.regla.lugaresIds.includes(lugarId)),
    );
  }
}

function porFechaYHora(a: { fecha: string; hora: string }, b: { fecha: string; hora: string }) {
  return a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora);
}
