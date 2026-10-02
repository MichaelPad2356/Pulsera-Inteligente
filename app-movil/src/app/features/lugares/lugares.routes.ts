import { Route } from '@angular/router';

/**
 * El detalle de un lugar se abre desde varias pestañas (Cultura, Gastronomía,
 * Conciertos, Mapa, Promociones). Cada pestaña agrega esta ruta a la suya para
 * que el botón "atrás" regrese a donde estaba el usuario.
 */
export const rutaLugarDetalle: Route = {
  path: 'lugar/:id',
  loadComponent: () =>
    import('./lugar-detalle/lugar-detalle.page').then((m) => m.LugarDetallePage),
};
