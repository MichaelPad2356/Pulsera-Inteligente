import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/angular';

@Component({
  selector: 'app-promocion-detalle',
  templateUrl: 'promocion-detalle.page.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton],
})
export class PromocionDetallePage {
  /** Viene de la ruta (…/promocion/:id). */
  readonly id = input.required<string>();
}
