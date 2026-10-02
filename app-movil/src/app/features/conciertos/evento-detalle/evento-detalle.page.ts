import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/angular';

@Component({
  selector: 'app-evento-detalle',
  templateUrl: 'evento-detalle.page.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton],
})
export class EventoDetallePage {
  /** Viene de la ruta (…/evento/:id). */
  readonly id = input.required<string>();
}
