import type { Timestamp } from 'firebase/firestore';

/**
 * interacciones/{id} — cada vez que se pasa la pulsera en un lector (RF-07, RF-09).
 *
 * Para las visitas el id es `${usuarioId}_${lugarId}_${dia}`: así la regla
 * "1 visita por lugar, por usuario, por día" se valida en la transacción
 * comprobando si el documento ya existe.
 */
export interface Interaccion {
  usuarioId: string;
  pulseraId: string;
  lugarId: string;
  tipo: 'visita' | 'canje';
  /** Solo en visitas a un foro el día de un evento (reglas 'eventos'). */
  eventoId?: string;
  /** Solo en canjes. */
  promocionId?: string;
  fechaHora: Timestamp;
  dia: string; // 'YYYY-MM-DD', hora de Aguascalientes
  valida: boolean;
}
