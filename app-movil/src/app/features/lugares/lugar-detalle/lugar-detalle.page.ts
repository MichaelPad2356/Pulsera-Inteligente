import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/angular';

@Component({
  selector: 'app-lugar-detalle',
  templateUrl: 'lugar-detalle.page.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton],
})
export class LugarDetallePage {
  /** Viene de la ruta (…/lugar/:id). */
  readonly id = input.required<string>();
}
