import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRouterLink,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { promocionVigente } from '../../../core/logica/promociones';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { distanciaMetros, formatearDistancia } from '../../../core/utils/distancia';
import { diaEnAgs } from '../../../core/utils/fechas';
import { TIPOS_LUGAR } from '../../../core/utils/tipos-lugar';
import { BotonMapaComponent } from '../../../shared/components/boton-mapa/boton-mapa.component';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { TarjetaPromocionComponent } from '../../../shared/components/tarjeta-promocion/tarjeta-promocion.component';
import { FechaCortaPipe } from '../../../shared/pipes/fechas.pipe';

/**
 * Detalle de cualquier lugar: establecimiento, pabellón o foro (RF-03, RF-11).
 * Nombre, categoría, descripción, horario, promociones, lo que pasa ahí y «Ver en el mapa».
 */
@Component({
  selector: 'app-lugar-detalle',
  templateUrl: 'lugar-detalle.page.html',
  styleUrls: ['lugar-detalle.page.scss'],
  imports: [
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonChip,
    IonIcon,
    IonLabel,
    IonList,
    IonListHeader,
    IonItem,
    IonSpinner,
    BotonMapaComponent,
    EstadoVacioComponent,
    TarjetaPromocionComponent,
    FechaCortaPipe,
  ],
})
export class LugarDetallePage {
  private readonly catalogo = inject(CatalogoService);
  private readonly ubicacion = inject(UbicacionService);

  /** Viene de la ruta (…/lugar/:id). */
  readonly id = input.required<string>();

  readonly cargando = this.catalogo.cargando;
  readonly lugar = computed(() => this.catalogo.lugar(this.id()));
  readonly tipo = computed(() => {
    const lugar = this.lugar();
    return lugar ? TIPOS_LUGAR[lugar.tipo] : null;
  });

  readonly promociones = computed(() => {
    const hoy = diaEnAgs();
    return this.catalogo.promocionesDeLugar(this.id()).filter((p) => promocionVigente(p, hoy));
  });

  readonly eventos = computed(() => {
    const hoy = diaEnAgs();
    return (this.catalogo.eventos() ?? []).filter((e) => e.lugarId === this.id() && e.fecha >= hoy);
  });

  readonly actividades = computed(() => {
    const hoy = diaEnAgs();
    return (this.catalogo.actividades() ?? []).filter(
      (a) => a.lugarId === this.id() && a.fecha >= hoy,
    );
  });

  readonly distancia = computed(() => {
    const posicion = this.ubicacion.posicion();
    const lugar = this.lugar();
    return posicion && lugar ? formatearDistancia(distanciaMetros(posicion, lugar)) : null;
  });
}
