import { Component, inject } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CatalogoService } from '../../../core/services/catalogo.service';
import { HistorialService } from '../../../core/services/historial.service';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { MomentoPipe } from '../../../shared/pipes/fechas.pipe';

/** RF-09: cada visita o canje con lugar, fecha, hora y tipo. */
@Component({
  selector: 'app-historial',
  templateUrl: 'historial.page.html',
  imports: [
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
    EstadoVacioComponent,
    MomentoPipe,
  ],
})
export class HistorialPage {
  private readonly catalogo = inject(CatalogoService);
  readonly interacciones = inject(HistorialService).interacciones;

  nombreLugar(id: string): string {
    return this.catalogo.lugar(id)?.nombre ?? 'Lugar eliminado';
  }

  artista(eventoId: string): string | null {
    return this.catalogo.evento(eventoId)?.artista ?? null;
  }

  tituloPromocion(promocionId: string): string {
    return this.catalogo.promocion(promocionId)?.titulo ?? 'Promoción';
  }
}
