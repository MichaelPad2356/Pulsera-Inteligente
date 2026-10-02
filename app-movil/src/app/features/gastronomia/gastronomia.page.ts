import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
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

import { TipoLugar } from '../../core/models';
import { CatalogoService } from '../../core/services/catalogo.service';
import { TIPOS_LUGAR } from '../../core/utils/tipos-lugar';
import { BotonMapaComponent } from '../../shared/components/boton-mapa/boton-mapa.component';
import { BotonPerfilComponent } from '../../shared/components/boton-perfil/boton-perfil.component';
import { EstadoVacioComponent } from '../../shared/components/estado-vacio/estado-vacio.component';

type Categoria = Extract<TipoLugar, 'restaurante' | 'bar' | 'hecho_en_ags'>;

/** RF-03: restaurantes, bares y el apartado Hecho en Aguascalientes. */
@Component({
  selector: 'app-gastronomia',
  templateUrl: 'gastronomia.page.html',
  styleUrls: ['gastronomia.page.scss'],
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
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonSpinner,
    BotonPerfilComponent,
    BotonMapaComponent,
    EstadoVacioComponent,
  ],
})
export class GastronomiaPage {
  private readonly catalogo = inject(CatalogoService);

  readonly tipos = TIPOS_LUGAR;
  readonly categoria = signal<Categoria>('restaurante');
  readonly cargando = this.catalogo.cargando;

  readonly establecimientos = computed(() =>
    (this.catalogo.lugares() ?? []).filter((l) => l.tipo === this.categoria()),
  );

  numeroDePromociones(lugarId: string): number {
    return this.catalogo.promocionesDeLugar(lugarId).length;
  }
}
