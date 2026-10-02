import { Routes } from '@angular/router';

import { rutaLugarDetalle } from '../lugares/lugares.routes';

// /tabs/promociones
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./promociones.page').then((m) => m.PromocionesPage),
  },
  {
    path: 'promocion/:id',
    loadComponent: () =>
      import('./promocion-detalle/promocion-detalle.page').then((m) => m.PromocionDetallePage),
  },
  rutaLugarDetalle,
];
