import { Routes } from '@angular/router';

import { rutaLugarDetalle } from '../lugares/lugares.routes';

// /tabs/conciertos
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./conciertos.page').then((m) => m.ConciertosPage),
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./evento-detalle/evento-detalle.page').then((m) => m.EventoDetallePage),
  },
  rutaLugarDetalle,
];
