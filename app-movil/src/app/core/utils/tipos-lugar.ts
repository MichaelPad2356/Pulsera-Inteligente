import { TipoLugar } from '../models';

export interface InfoTipoLugar {
  nombre: string;
  /** Nombre de un ícono de ionicons. */
  icono: string;
  /** Color del marcador en el mapa. */
  color: string;
}

/** Cómo se muestra cada tipo de lugar en listas y en el mapa. */
export const TIPOS_LUGAR: Record<TipoLugar, InfoTipoLugar> = {
  foro: { nombre: 'Foro', icono: 'musical-notes', color: '#e03131' },
  pabellon: { nombre: 'Pabellón cultural', icono: 'color-palette', color: '#1971c2' },
  restaurante: { nombre: 'Restaurante', icono: 'restaurant', color: '#e8590c' },
  bar: { nombre: 'Bar', icono: 'beer', color: '#9c36b5' },
  hecho_en_ags: { nombre: 'Hecho en Aguascalientes', icono: 'storefront', color: '#2f9e44' },
  otro: { nombre: 'Otro punto de interés', icono: 'location', color: '#495057' },
};
