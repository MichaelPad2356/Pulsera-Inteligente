import { Component, computed, inject, signal } from '@angular/core';
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
  IonSearchbar,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import { mensajeDeError } from '../../../core/errores';
import { COL, ConId, Lugar } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { TIPOS_LUGAR } from '../../../core/utils/tipos-lugar';
import { AdminService } from '../admin.service';

/** RF-12: agregar, editar, eliminar y desactivar lugares (establecimientos, pabellones, foros). */
@Component({
  selector: 'app-admin-lugares',
  templateUrl: 'lugares.page.html',
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
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonToggle,
  ],
})
export class LugaresPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);
  private readonly alertas = inject(AlertController);

  readonly tipos = TIPOS_LUGAR;
  readonly busqueda = signal('');
  readonly lugares = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es');
    return (this.catalogo.lugaresTodos() ?? []).filter(
      (l) => !texto || l.nombre.toLocaleLowerCase('es').includes(texto),
    );
  });

  alternarActivo(lugar: ConId<Lugar>): void {
    void this.admin.actualizar(COL.lugares, lugar.id, { activo: !lugar.activo });
  }

  async eliminar(lugar: ConId<Lugar>): Promise<void> {
    // No se borra un lugar que todavía usan eventos, actividades o promociones.
    const usos =
      (this.catalogo.eventos() ?? []).filter((e) => e.lugarId === lugar.id).length +
      (this.catalogo.actividades() ?? []).filter((a) => a.lugarId === lugar.id).length +
      (this.catalogo.promocionesTodas() ?? []).filter(
        (p) =>
          p.lugarId === lugar.id ||
          (p.regla.tipo === 'lugares' && p.regla.lugaresIds.includes(lugar.id)),
      ).length;
    if (usos > 0) {
      const aviso = await this.alertas.create({
        header: 'No se puede eliminar',
        message: `«${lugar.nombre}» tiene ${usos} evento(s), actividad(es) o promoción(es). Desactívalo para ocultarlo.`,
        buttons: ['Entendido'],
      });
      await aviso.present();
      return;
    }
    const confirmar = await this.alertas.create({
      header: 'Eliminar lugar',
      message: `¿Eliminar «${lugar.nombre}»? No se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.admin.eliminar(COL.lugares, lugar.id).catch(async (e) => {
              const error = await this.alertas.create({ message: mensajeDeError(e), buttons: ['OK'] });
              await error.present();
            });
          },
        },
      ],
    });
    await confirmar.present();
  }
}
