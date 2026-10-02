import { Routes } from '@angular/router';

import { AdminLayoutPage } from './layout/admin-layout.page';

// /admin — panel administrativo (RF-12), solo rol admin. Cada catálogo tiene su lista
// y un formulario que sirve para crear (/nuevo) y editar (/:id).
export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutPage,
    children: [
      {
        path: '',
        loadComponent: () => import('./resumen/resumen.page').then((m) => m.ResumenPage),
      },
      {
        path: 'interacciones',
        loadComponent: () =>
          import('./interacciones/interacciones.page').then((m) => m.InteraccionesPage),
      },
      {
        path: 'lugares',
        loadComponent: () => import('./lugares/lugares.page').then((m) => m.LugaresPage),
      },
      {
        path: 'lugares/:id',
        loadComponent: () => import('./lugares/lugar-form.page').then((m) => m.LugarFormPage),
      },
      {
        path: 'actividades',
        loadComponent: () =>
          import('./actividades/actividades.page').then((m) => m.ActividadesPage),
      },
      {
        path: 'actividades/:id',
        loadComponent: () =>
          import('./actividades/actividad-form.page').then((m) => m.ActividadFormPage),
      },
      {
        path: 'eventos',
        loadComponent: () => import('./eventos/eventos.page').then((m) => m.EventosPage),
      },
      {
        path: 'eventos/:id',
        loadComponent: () => import('./eventos/evento-form.page').then((m) => m.EventoFormPage),
      },
      {
        path: 'promociones',
        loadComponent: () =>
          import('./promociones/promociones.page').then((m) => m.PromocionesAdminPage),
      },
      {
        path: 'promociones/:id',
        loadComponent: () =>
          import('./promociones/promocion-form.page').then((m) => m.PromocionFormPage),
      },
      {
        path: 'pulseras',
        loadComponent: () => import('./pulseras/pulseras.page').then((m) => m.PulserasPage),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./usuarios/usuarios.page').then((m) => m.UsuariosPage),
      },
    ],
  },
];
