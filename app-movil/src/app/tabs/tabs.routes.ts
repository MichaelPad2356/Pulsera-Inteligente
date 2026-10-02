import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

// /tabs — las 5 secciones del PDF. Cada una define sus propias rutas internas.
export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'cultura',
        loadChildren: () => import('../features/cultura/cultura.routes').then((m) => m.routes),
      },
      {
        path: 'gastronomia',
        loadChildren: () =>
          import('../features/gastronomia/gastronomia.routes').then((m) => m.routes),
      },
      {
        path: 'conciertos',
        loadChildren: () =>
          import('../features/conciertos/conciertos.routes').then((m) => m.routes),
      },
      {
        path: 'mapa',
        loadChildren: () => import('../features/mapa/mapa.routes').then((m) => m.routes),
      },
      {
        path: 'promociones',
        loadChildren: () =>
          import('../features/promociones/promociones.routes').then((m) => m.routes),
      },
      { path: '', redirectTo: 'conciertos', pathMatch: 'full' },
    ],
  },
];
