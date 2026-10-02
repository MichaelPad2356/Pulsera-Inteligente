import { Routes } from '@angular/router';

// Mapa de la app:
//   /auth/...            iniciar sesión y registrarse
//   /tabs/...            las 5 secciones (visitante)
//   /perfil/...          perfil, historial y vincular pulsera
//   /establecimiento     modo lector del establecimiento
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'perfil',
    loadChildren: () => import('./features/perfil/perfil.routes').then((m) => m.routes),
  },
  {
    path: 'establecimiento',
    loadChildren: () =>
      import('./features/establecimiento/establecimiento.routes').then((m) => m.routes),
  },
  { path: '', redirectTo: '/tabs/conciertos', pathMatch: 'full' },
];
