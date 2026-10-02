import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
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
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import { textoRegla } from '../../../core/logica/promociones';
import { COL, ConId, Promocion } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { FechaCortaPipe } from '../../../shared/pipes/fechas.pipe';
import { AdminService } from '../admin.service';

/** RF-12: crear, editar y desactivar promociones (con cuántas se han desbloqueado y canjeado). */
@Component({
  selector: 'app-admin-promociones',
  templateUrl: 'promociones.page.html',
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
    IonToggle,
    FechaCortaPipe,
  ],
})
export class PromocionesAdminPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);

  readonly promociones = computed(() => this.catalogo.promocionesTodas() ?? []);

  /** Por promoción: cuántos la desbloquearon (incluye usadas) y cuántos la usaron. */
  private readonly conteos = computed(() => {
    const conteos = new Map<string, { desbloqueadas: number; usadas: number }>();
    for (const p of this.admin.progresos() ?? []) {
      const c = conteos.get(p.id) ?? { desbloqueadas: 0, usadas: 0 };
      if (p.estado !== 'en_progreso') c.desbloqueadas++;
      if (p.estado === 'utilizada') c.usadas++;
      conteos.set(p.id, c);
    }
    return conteos;
  });

  conteo(id: string) {
    return this.conteos().get(id) ?? { desbloqueadas: 0, usadas: 0 };
  }

  regla(promocion: Promocion): string {
    return textoRegla(promocion.regla);
  }

  nombreLugar(id: string): string {
    return this.catalogo.lugar(id)?.nombre ?? '(lugar eliminado)';
  }

  alternarActiva(promocion: ConId<Promocion>): void {
    void this.admin.actualizar(COL.promociones, promocion.id, { activa: !promocion.activa });
  }
}
