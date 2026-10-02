/** eventos/{id} — conciertos y otros eventos (RF-04). */
export interface Evento {
  artista: string;
  descripcion: string;
  fecha: string; // 'YYYY-MM-DD'
  hora: string; // 'HH:mm'
  /** Foro donde se presenta. */
  lugarId: string;
  imagen?: string;
}
