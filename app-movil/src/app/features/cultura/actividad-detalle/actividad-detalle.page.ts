import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRouterLink,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CatalogoService } from '../../../core/services/catalogo.service';
import { BotonMapaComponent } from '../../../shared/components/boton-mapa/boton-mapa.component';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { FechaLargaPipe } from '../../../shared/pipes/fechas.pipe';

/** RF-02: nombre, fecha, hora, descripción, lugar y «Ver ubicación». */
@Component({
  selector: 'app-actividad-detalle',
  templateUrl: 'actividad-detalle.page.html',
  imports: [
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    BotonMapaComponent,
    EstadoVacioComponent,
    FechaLargaPipe,
  ],
})
export class ActividadDetallePage {
  private readonly catalogo = inject(CatalogoService);

  /** Viene de la ruta (…/actividad/:id). */
  readonly id = input.required<string>();

  readonly cargando = this.catalogo.cargando;
  readonly actividad = computed(() => this.catalogo.actividad(this.id()));
  readonly lugar = computed(() => this.catalogo.lugar(this.actividad()?.lugarId));
}
