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

import { COL, ConId, Evento } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { FechaCortaPipe } from '../../../shared/pipes/fechas.pipe';
import { AdminService } from '../admin.service';

/** RF-12: agregar y modificar conciertos y eventos. */
@Component({
  selector: 'app-admin-eventos',
  templateUrl: 'eventos.page.html',
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
export class EventosPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);
  private readonly alertas = inject(AlertController);

  readonly eventos = computed(() => this.catalogo.eventos() ?? []);

  nombreLugar(id: string): string {
    return this.catalogo.lugar(id)?.nombre ?? '(lugar eliminado)';
  }

  async eliminar(evento: ConId<Evento>): Promise<void> {
    const confirmar = await this.alertas.create({
      header: 'Eliminar evento',
      message: `¿Eliminar «${evento.artista}»?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => void this.admin.eliminar(COL.eventos, evento.id),
        },
      ],
    });
    await confirmar.present();
  }
}
