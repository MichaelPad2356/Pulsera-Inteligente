import { Routes } from '@angular/router';

import { rutaLugarDetalle } from '../lugares/lugares.routes';

// /tabs/mapa — acepta ?lugar={id} para abrir el mapa centrado en ese lugar (RF-11).
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./mapa.page').then((m) => m.MapaPage),
  },
  rutaLugarDetalle,
];
