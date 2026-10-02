import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonRouterLink,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { SeccionPromocion, seccionDe } from '../../core/logica/promociones';
import { ConId, Promocion } from '../../core/models';
import { CatalogoService } from '../../core/services/catalogo.service';
import { ProgresoService } from '../../core/services/progreso.service';
import { PulserasService } from '../../core/services/pulseras.service';
import { diaEnAgs } from '../../core/utils/fechas';
import { BotonPerfilComponent } from '../../shared/components/boton-perfil/boton-perfil.component';
import { EstadoVacioComponent } from '../../shared/components/estado-vacio/estado-vacio.component';
import { TarjetaPromocionComponent } from '../../shared/components/tarjeta-promocion/tarjeta-promocion.component';

const MENSAJES_VACIO: Record<SeccionPromocion, string> = {
  disponibles: 'No hay promociones disponibles por ahora.',
  desbloqueadas: 'Aún no desbloqueas promociones. ¡Visita lugares con tu pulsera!',
  utilizadas: 'Todavía no has usado ninguna promoción.',
};

/** RF-08 y RF-10: promociones disponibles, desbloqueadas y utilizadas, con su progreso en vivo. */
@Component({
  selector: 'app-promociones',
  templateUrl: 'promociones.page.html',
  imports: [
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonBadge,
    IonCard,
    IonCardContent,
    IonIcon,
    IonSpinner,
    BotonPerfilComponent,
    EstadoVacioComponent,
    TarjetaPromocionComponent,
  ],
})
export class PromocionesPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly progresos = inject(ProgresoService);
  private readonly pulseras = inject(PulserasService);

  readonly seccion = signal<SeccionPromocion>('disponibles');
  readonly cargando = computed(
    () => this.catalogo.cargando() || this.progresos.progresos() === undefined,
  );
  readonly sinPulsera = computed(() => this.pulseras.miPulsera() === null);
  readonly mensajeVacio = computed(() => MENSAJES_VACIO[this.seccion()]);

  /** Todas las promociones repartidas en sus tres secciones. */
  private readonly porSeccion = computed(() => {
    const hoy = diaEnAgs();
    const secciones: Record<SeccionPromocion, ConId<Promocion>[]> = {
      disponibles: [],
      desbloqueadas: [],
      utilizadas: [],
    };
    for (const promo of this.catalogo.promociones() ?? []) {
      const seccion = seccionDe(promo, this.progresos.de(promo.id), hoy);
      if (seccion) secciones[seccion].push(promo);
    }
    return secciones;
  });

  readonly visibles = computed(() => this.porSeccion()[this.seccion()]);
  readonly totalDesbloqueadas = computed(() => this.porSeccion().desbloqueadas.length);
}
