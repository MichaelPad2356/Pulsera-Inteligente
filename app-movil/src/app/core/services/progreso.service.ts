import { Injectable, computed, inject } from '@angular/core';
import { collection } from 'firebase/firestore';

import { consultaEnVivo } from '../en-vivo';
import { FIRESTORE } from '../firebase';
import { COL, Progreso } from '../models';
import { AuthService } from './auth.service';

/** Avance del usuario en cada promoción, en vivo (RF-10). */
@Injectable({ providedIn: 'root' })
export class ProgresoService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  /** `usuarios/{uid}/progreso`. El id de cada documento es el de la promoción. */
  readonly progresos = consultaEnVivo<Progreso>(() => {
    const uid = this.auth.uid();
    return uid ? collection(this.db, COL.usuarios, uid, COL.progreso) : null;
  });

  private readonly porPromocion = computed(
    () => new Map((this.progresos() ?? []).map((p) => [p.id, p])),
  );

  de(promocionId: string): Progreso | undefined {
    return this.porPromocion().get(promocionId);
  }
}
