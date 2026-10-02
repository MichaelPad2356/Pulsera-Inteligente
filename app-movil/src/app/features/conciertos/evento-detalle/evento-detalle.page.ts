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

/** RF-04: artista, fecha, hora, foro, descripción, ubicación e «Ir a ubicación». */
@Component({
  selector: 'app-evento-detalle',
  templateUrl: 'evento-detalle.page.html',
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
export class EventoDetallePage {
  private readonly catalogo = inject(CatalogoService);

  /** Viene de la ruta (…/evento/:id). */
  readonly id = input.required<string>();

  readonly cargando = this.catalogo.cargando;
  readonly evento = computed(() => this.catalogo.evento(this.id()));
  readonly foro = computed(() => this.catalogo.lugar(this.evento()?.lugarId));
}
