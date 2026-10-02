import type { Timestamp } from 'firebase/firestore';

/**
 * pulseras/{uidChip} — RF-01 y RF-07: identificador único de cada pulsera.
 * El id es el UID del NTAG213 en hex mayúsculas, sin separadores (ej. '04A1B2C3D4E5F6').
 */
export interface Pulsera {
  /** Código corto impreso en la pulsera, para vincularla sin NFC. */
  codigo: string;
  usuarioId: string | null;
  estado: 'activa' | 'bloqueada';
  vinculadaEn: Timestamp | null;
}
