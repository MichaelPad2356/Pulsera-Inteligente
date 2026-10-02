import { Routes } from '@angular/router';

import { rutaLugarDetalle } from '../lugares/lugares.routes';

// /tabs/gastronomia
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./gastronomia.page').then((m) => m.GastronomiaPage),
  },
  rutaLugarDetalle,
];
