export type TipoLugar =
  | 'restaurante'
  | 'bar'
  | 'hecho_en_ags'
  | 'pabellon'
  | 'foro'
  | 'otro';

/**
 * lugares/{id} — todo lo que tiene ubicación en el mapa (RF-05, RF-11):
 * establecimientos, pabellones culturales y foros.
 */
export interface Lugar {
  nombre: string;
  tipo: TipoLugar;
  descripcion: string;
  horario: string;
  lat: number;
  lng: number;
  imagen?: string;
  activo: boolean;
}
