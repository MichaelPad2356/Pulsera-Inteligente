import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonRouterLink,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { Actividad, COL, ConId } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { FechaCortaPipe } from '../../../shared/pipes/fechas.pipe';
import { AdminService } from '../admin.service';

/** RF-12: agregar y modificar actividades culturales. */
@Component({
  selector: 'app-admin-actividades',
  templateUrl: 'actividades.page.html',
  imports: [
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    FechaCortaPipe,
  ],
})
export class ActividadesPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);
  private readonly alertas = inject(AlertController);

  readonly actividades = computed(() => this.catalogo.actividades() ?? []);

  nombreLugar(id: string): string {
    return this.catalogo.lugar(id)?.nombre ?? '(lugar eliminado)';
  }

  async eliminar(actividad: ConId<Actividad>): Promise<void> {
    const confirmar = await this.alertas.create({
      header: 'Eliminar actividad',
      message: `¿Eliminar «${actividad.nombre}»?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => void this.admin.eliminar(COL.actividades, actividad.id),
        },
      ],
    });
    await confirmar.present();
  }
}
