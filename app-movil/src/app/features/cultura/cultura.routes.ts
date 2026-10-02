import { Routes } from '@angular/router';

import { rutaLugarDetalle } from '../lugares/lugares.routes';

// /tabs/cultura
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./cultura.page').then((m) => m.CulturaPage),
  },
  {
    path: 'actividad/:id',
    loadComponent: () =>
      import('./actividad-detalle/actividad-detalle.page').then((m) => m.ActividadDetallePage),
  },
  rutaLugarDetalle,
];
