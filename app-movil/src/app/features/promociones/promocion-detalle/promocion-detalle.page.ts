import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { textoRegla } from '../../../core/logica/promociones';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { ProgresoService } from '../../../core/services/progreso.service';
import { diaEnAgs } from '../../../core/utils/fechas';
import { BotonMapaComponent } from '../../../shared/components/boton-mapa/boton-mapa.component';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { ProgresoPromocionComponent } from '../../../shared/components/progreso-promocion/progreso-promocion.component';
import { FechaCortaPipe, FechaLargaPipe, MomentoPipe } from '../../../shared/pipes/fechas.pipe';

/** RF-08 y RF-10: establecimiento, condiciones, vigencia, ubicación y progreso de una promoción. */
@Component({
  selector: 'app-promocion-detalle',
  templateUrl: 'promocion-detalle.page.html',
  styleUrls: ['promocion-detalle.page.scss'],
  imports: [
    RouterLink,
    IonRouterLink,
    IonRouterLinkWithHref,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    BotonMapaComponent,
    EstadoVacioComponent,
    ProgresoPromocionComponent,
    FechaLargaPipe,
    FechaCortaPipe,
    MomentoPipe,
  ],
})
export class PromocionDetallePage {
  private readonly catalogo = inject(CatalogoService);
  private readonly progresos = inject(ProgresoService);

  /** Viene de la ruta (…/promocion/:id). */
  readonly id = input.required<string>();

  readonly cargando = this.catalogo.cargando;
  readonly promocion = computed(() => this.catalogo.promocion(this.id()));
  readonly lugar = computed(() => this.catalogo.lugar(this.promocion()?.lugarId));
  readonly progreso = computed(() => this.progresos.de(this.id()));
  readonly regla = computed(() => {
    const promo = this.promocion();
    return promo ? textoRegla(promo.regla) : '';
  });

  /** Para reglas de lugares específicos: cada lugar de la ruta y si ya se visitó. */
  readonly ruta = computed(() => {
    const promo = this.promocion();
    if (promo?.regla.tipo !== 'lugares') return [];
    const contados = new Set(this.progreso()?.contados ?? []);
    return promo.regla.lugaresIds.map((id) => ({
      id,
      nombre: this.catalogo.lugar(id)?.nombre ?? id,
      visitado: contados.has(id),
    }));
  });

  /** Para reglas de eventos: los próximos eventos a los que puede asistir. */
  readonly proximosEventos = computed(() => {
    if (this.promocion()?.regla.tipo !== 'eventos') return [];
    const hoy = diaEnAgs();
    return (this.catalogo.eventos() ?? []).filter((e) => e.fecha >= hoy).slice(0, 5);
  });
}
