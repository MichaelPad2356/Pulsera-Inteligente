import { Routes } from '@angular/router';

// /establecimiento — modo lector, solo para usuarios con rol 'establecimiento'.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./lector/lector.page').then((m) => m.LectorPage),
  },
];
