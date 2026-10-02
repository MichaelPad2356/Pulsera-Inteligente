import { Routes } from '@angular/router';

// /perfil
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./perfil.page').then((m) => m.PerfilPage),
  },
  {
    path: 'historial',
    loadComponent: () => import('./historial/historial.page').then((m) => m.HistorialPage),
  },
  {
    path: 'vincular-pulsera',
    loadComponent: () =>
      import('./vincular-pulsera/vincular-pulsera.page').then((m) => m.VincularPulseraPage),
  },
];
