import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonRouterLink,
} from '@ionic/angular';

import { textoRegla } from '../../../core/logica/promociones';
import { ConId, Promocion } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { ProgresoService } from '../../../core/services/progreso.service';
import { FechaCortaPipe, MomentoPipe } from '../../pipes/fechas.pipe';
import { ProgresoPromocionComponent } from '../progreso-promocion/progreso-promocion.component';

/** Tarjeta de una promoción con su progreso. Lleva al detalle (RF-08, RF-10). */
@Component({
  selector: 'app-tarjeta-promocion',
  template: `
    <ion-card [routerLink]="['/tabs/promociones/promocion', promocion().id]" button>
      <ion-card-header>
        <ion-card-subtitle>{{ lugar()?.nombre ?? '' }}</ion-card-subtitle>
        <ion-card-title>{{ promocion().titulo }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        @switch (progreso()?.estado) {
          @case ('desbloqueada') {
            <p class="estado exito">
              <ion-icon name="sparkles" /> ¡Desbloqueada! Pasa tu pulsera en {{ lugar()?.nombre }} para usarla.
            </p>
          }
          @case ('utilizada') {
            <p class="estado">
              <ion-icon name="checkmark-done-outline" /> Utilizada {{ progreso()?.utilizadaEn | momento }}
            </p>
          }
          @default {
            <p>{{ regla() }}</p>
            <app-progreso-promocion [promocion]="promocion()" [progreso]="progreso()" />
            <p class="vigencia">Válida hasta el {{ promocion().vigenciaFin | fechaCorta }}</p>
          }
        }
      </ion-card-content>
    </ion-card>
  `,
  styles: `
    .estado { display: flex; align-items: center; gap: 6px; font-weight: 500; }
    .exito { color: var(--ion-color-success); }
    .vigencia { margin-top: 8px; font-size: 0.8rem; color: var(--ion-color-medium); }
  `,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    RouterLink,
    IonRouterLink,
    ProgresoPromocionComponent,
    FechaCortaPipe,
    MomentoPipe,
  ],
})
export class TarjetaPromocionComponent {
  private readonly catalogo = inject(CatalogoService);
  private readonly progresos = inject(ProgresoService);

  readonly promocion = input.required<ConId<Promocion>>();

  readonly lugar = computed(() => this.catalogo.lugar(this.promocion().lugarId));
  readonly progreso = computed(() => this.progresos.de(this.promocion().id));
  readonly regla = computed(() => textoRegla(this.promocion().regla));
}
