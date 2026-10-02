import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterLink,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

/** Secciones del panel (RF-12). */
const SECCIONES = [
  { ruta: '/admin', icono: 'stats-chart-outline', texto: 'Resumen y estadísticas', exacta: true },
  { ruta: '/admin/interacciones', icono: 'list-outline', texto: 'Interacciones' },
  { ruta: '/admin/lugares', icono: 'storefront', texto: 'Lugares' },
  { ruta: '/admin/actividades', icono: 'color-palette', texto: 'Actividades culturales' },
  { ruta: '/admin/eventos', icono: 'musical-notes', texto: 'Conciertos y eventos' },
  { ruta: '/admin/promociones', icono: 'gift-outline', texto: 'Promociones' },
  { ruta: '/admin/pulseras', icono: 'watch-outline', texto: 'Pulseras' },
  { ruta: '/admin/usuarios', icono: 'people-outline', texto: 'Usuarios' },
];

/** Marco del panel: menú lateral (fijo en computadora, deslizable en celular). */
@Component({
  selector: 'app-admin-layout',
  templateUrl: 'admin-layout.page.html',
  styleUrls: ['admin-layout.page.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonRouterLink,
    IonSplitPane,
    IonMenu,
    IonMenuToggle,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
  ],
})
export class AdminLayoutPage {
  readonly secciones = SECCIONES;
}
