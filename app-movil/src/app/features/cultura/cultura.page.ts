import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRouterLink,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { Actividad, ConId } from '../../core/models';
import { CatalogoService } from '../../core/services/catalogo.service';
import { diaEnAgs } from '../../core/utils/fechas';
import { BotonMapaComponent } from '../../shared/components/boton-mapa/boton-mapa.component';
import { BotonPerfilComponent } from '../../shared/components/boton-perfil/boton-perfil.component';
import { EstadoVacioComponent } from '../../shared/components/estado-vacio/estado-vacio.component';
import { FechaLargaPipe } from '../../shared/pipes/fechas.pipe';

/** RF-02: pabellones culturales y actividades programadas. */
@Component({
  selector: 'app-cultura',
  templateUrl: 'cultura.page.html',
  imports: [
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonListHeader,
    IonItem,
    IonIcon,
    IonSpinner,
    BotonPerfilComponent,
    BotonMapaComponent,
    EstadoVacioComponent,
    FechaLargaPipe,
  ],
})
export class CulturaPage {
  private readonly catalogo = inject(CatalogoService);

  readonly seccion = signal<'actividades' | 'pabellones'>('actividades');
  readonly cargando = this.catalogo.cargando;

  readonly pabellones = computed(() =>
    (this.catalogo.lugares() ?? []).filter((l) => l.tipo === 'pabellon'),
  );

  /** Actividades de hoy en adelante, agrupadas por día. */
  readonly dias = computed(() => {
    const hoy = diaEnAgs();
    const grupos = new Map<string, ConId<Actividad>[]>();
    for (const actividad of this.catalogo.actividades() ?? []) {
      if (actividad.fecha < hoy) continue;
      grupos.set(actividad.fecha, [...(grupos.get(actividad.fecha) ?? []), actividad]);
    }
    return [...grupos].map(([dia, actividades]) => ({ dia, actividades }));
  });

  nombreLugar(id: string): string {
    return this.catalogo.lugar(id)?.nombre ?? '';
  }
}
