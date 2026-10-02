import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon, IonRouterLink } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';

/** Botón de la barra superior de cada pestaña que lleva a "Mi perfil". */
@Component({
  selector: 'app-boton-perfil',
  template: `
    <ion-button routerLink="/perfil" aria-label="Mi perfil">
      <ion-icon slot="icon-only" name="person-circle-outline" />
    </ion-button>
  `,
  imports: [IonButton, IonIcon, RouterLink, IonRouterLink],
})
export class BotonPerfilComponent {
  constructor() {
    addIcons({ personCircleOutline });
  }
}
