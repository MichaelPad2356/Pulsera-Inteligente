/**
 * Reglas configurables para desbloquear una promoción (RF-08).
 * Son los tres ejemplos que da el PDF.
 */
export type ReglaPromocion =
  /** Número de establecimientos visitados: N lugares distintos. Ej. "3 de 5". */
  | { tipo: 'cantidad'; meta: number }
  /** Lugares específicos: visitar todos los de la lista (meta = lugaresIds.length). */
  | { tipo: 'lugares'; meta: number; lugaresIds: string[] }
  /** Participación en eventos: N eventos distintos (visita registrada en el foro el día del evento). */
  | { tipo: 'eventos'; meta: number };

/** promociones/{id} — RF-08. */
export interface Promocion {
  titulo: string;
  /** Lugar que otorga la promoción y donde se canjea (su ubicación). */
  lugarId: string;
  condiciones: string;
  regla: ReglaPromocion;
  vigenciaInicio: string; // 'YYYY-MM-DD'
  vigenciaFin: string; // 'YYYY-MM-DD'
  /** El panel "desactiva" en lugar de borrar (RF-12). */
  activa: boolean;
}
