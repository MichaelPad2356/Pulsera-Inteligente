import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/angular';

@Component({
  selector: 'app-actividad-detalle',
  templateUrl: 'actividad-detalle.page.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton],
})
export class ActividadDetallePage {
  /** Viene de la ruta (…/actividad/:id). */
  readonly id = input.required<string>();
}
