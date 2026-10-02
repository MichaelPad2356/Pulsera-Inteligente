import { Routes } from '@angular/router';

import { invitadoGuard, rolGuard, sesionGuard } from './core/guards/auth.guards';

// Mapa de la app:
//   /auth/...            iniciar sesión y registrarse (solo sin sesión)
//   /tabs/...            las 5 secciones del visitante
//   /perfil/...          perfil, historial y vincular pulsera
//   /establecimiento     modo lector (rol establecimiento o admin)
//   /admin/...           panel administrativo (solo admin)
//   /p/{codigo}          enlace grabado en cada pulsera → vincularla
export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [invitadoGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  {
    path: 'tabs',
    canActivate: [sesionGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'perfil',
    canActivate: [sesionGuard],
    loadChildren: () => import('./features/perfil/perfil.routes').then((m) => m.routes),
  },
  {
    path: 'establecimiento',
    canActivate: [sesionGuard, rolGuard('establecimiento', 'admin')],
    loadChildren: () =>
      import('./features/establecimiento/establecimiento.routes').then((m) => m.routes),
  },
  {
    path: 'admin',
    canActivate: [sesionGuard, rolGuard('admin')],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.routes),
  },
  {
    // Al acercar la pulsera a un teléfono se abre este enlace (ver core/utils/pulsera.ts).
    path: 'p/:codigo',
    redirectTo: ({ params }) => `/perfil/vincular-pulsera?codigo=${params['codigo']}`,
  },
  { path: '', redirectTo: '/tabs/conciertos', pathMatch: 'full' },
  { path: '**', redirectTo: '/tabs/conciertos' },
];
