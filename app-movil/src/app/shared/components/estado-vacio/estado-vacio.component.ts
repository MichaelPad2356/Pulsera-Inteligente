import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/** Mensaje cuando una lista no tiene elementos. */
@Component({
  selector: 'app-estado-vacio',
  template: `
    <div class="vacio">
      <ion-icon [name]="icono()" />
      <p>{{ mensaje() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    .vacio { text-align: center; padding: 48px 24px; color: var(--ion-color-medium); }
    ion-icon { font-size: 48px; }
  `,
  imports: [IonIcon],
})
export class EstadoVacioComponent {
  readonly icono = input('information-circle-outline');
  readonly mensaje = input.required<string>();
}
