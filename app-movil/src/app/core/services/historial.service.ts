import { Injectable, computed, inject } from '@angular/core';
import { collection, query, where } from 'firebase/firestore';

import { consultaEnVivo } from '../en-vivo';
import { FIRESTORE } from '../firebase';
import { COL, Interaccion } from '../models';
import { AuthService } from './auth.service';

/** Visitas y canjes del usuario con sesión, en vivo (RF-09). */
@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  // Solo filtro de igualdad: no necesita índice compuesto. El orden se hace aquí.
  private readonly mias = consultaEnVivo<Interaccion>(() => {
    const uid = this.auth.uid();
    return uid ? query(collection(this.db, COL.interacciones), where('usuarioId', '==', uid)) : null;
  });

  /** Más recientes primero. `undefined` mientras carga. */
  readonly interacciones = computed(() =>
    this.mias()
      ?.slice()
      .sort((a, b) => b.fechaHora.toMillis() - a.fechaHora.toMillis()),
  );

  private readonly visitas = computed(() =>
    (this.interacciones() ?? []).filter((i) => i.tipo === 'visita'),
  );

  /** RF-08: cuántos lugares, establecimientos y eventos ha visitado. */
  readonly totalVisitas = computed(() => this.visitas().length);
  readonly lugaresVisitados = computed(() => new Set(this.visitas().map((v) => v.lugarId)).size);
  readonly eventosAsistidos = computed(
    () => new Set(this.visitas().flatMap((v) => (v.eventoId ? [v.eventoId] : []))).size,
  );
  readonly canjes = computed(
    () => (this.interacciones() ?? []).filter((i) => i.tipo === 'canje').length,
  );
}
