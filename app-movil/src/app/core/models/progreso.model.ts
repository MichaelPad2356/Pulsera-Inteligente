import type { Timestamp } from 'firebase/firestore';

export type EstadoProgreso = 'en_progreso' | 'desbloqueada' | 'utilizada';

/** usuarios/{uid}/progreso/{promocionId} — avance del usuario en cada promoción (RF-10). */
export interface Progreso {
  avance: number;
  meta: number;
  estado: EstadoProgreso;
  /**
   * Ids que ya sumaron al avance (lugares o eventos, según la regla).
   * Evita contar dos veces el mismo lugar o evento.
   */
  contados: string[];
  desbloqueadaEn: Timestamp | null;
  utilizadaEn: Timestamp | null;
}
