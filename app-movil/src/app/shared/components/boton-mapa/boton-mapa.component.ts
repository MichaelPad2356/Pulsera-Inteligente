import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular';

/**
 * «Ver ubicación» (RF-02, RF-03, RF-04, RF-08, RF-11). Abre la pestaña Mapa centrada en el lugar.
 * Todas las secciones usan este mismo botón, así que el mapa siempre se abre igual.
 */
@Component({
  selector: 'app-boton-mapa',
  template: `
    @if (compacto()) {
      <ion-button fill="clear" (click)="abrir($event)" aria-label="Ver ubicación en el mapa">
        <ion-icon slot="icon-only" name="location-outline" />
      </ion-button>
    } @else {
      <ion-button expand="block" (click)="abrir($event)">
        <ion-icon slot="start" name="location-outline" />
        {{ texto() }}
      </ion-button>
    }
  `,
  imports: [IonButton, IonIcon],
})
export class BotonMapaComponent {
  private readonly router = inject(Router);

  readonly lugarId = input.required<string>();
  readonly texto = input('Ver ubicación');
  /** Solo el ícono, para listas. */
  readonly compacto = input(false);

  abrir(evento: Event): void {
    // En listas el botón está dentro de un elemento que también es clickeable.
    evento.stopPropagation();
    void this.router.navigate(['/tabs/mapa'], { queryParams: { lugar: this.lugarId() } });
  }
}
