/** actividades/{id} — actividades culturales (RF-02). */
export interface Actividad {
  nombre: string;
  descripcion: string;
  fecha: string; // 'YYYY-MM-DD'
  hora: string; // 'HH:mm'
  /** Pabellón donde se realiza. */
  lugarId: string;
}
