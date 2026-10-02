import { Component, computed, input } from '@angular/core';
import { IonProgressBar } from '@ionic/angular';

import { avanceDe, unidadRegla } from '../../../core/logica/promociones';
import { Progreso, Promocion } from '../../../core/models';

/** Barra «3 de 5» y «Te faltan 2 lugares» (RF-10). */
@Component({
  selector: 'app-progreso-promocion',
  template: `
    <ion-progress-bar [value]="avance().fraccion" [color]="avance().faltan === 0 ? 'success' : 'primary'" />
    <p class="texto">
      <strong>{{ avance().avance }} de {{ avance().meta }}</strong>
      @if (avance().faltan > 0) {
        · Te {{ avance().faltan === 1 ? 'falta' : 'faltan' }} {{ avance().faltan }} {{ unidad() }}
      } @else {
        · ¡Completada!
      }
    </p>
  `,
  styles: `
    ion-progress-bar { height: 8px; border-radius: 4px; }
    .texto { margin: 6px 0 0; font-size: 0.9rem; color: var(--ion-color-medium); }
  `,
  imports: [IonProgressBar],
})
export class ProgresoPromocionComponent {
  readonly promocion = input.required<Promocion>();
  readonly progreso = input<Progreso | undefined>();

  readonly avance = computed(() => avanceDe(this.promocion(), this.progreso()));
  readonly unidad = computed(() => unidadRegla(this.promocion().regla, this.avance().faltan));
}
