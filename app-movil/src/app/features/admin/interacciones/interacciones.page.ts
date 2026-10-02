import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CatalogoService } from '../../../core/services/catalogo.service';
import { MomentoPipe } from '../../../shared/pipes/fechas.pipe';
import { AdminService } from '../admin.service';

const TODOS = 'todos';

/** RF-12: consultar las interacciones (visitas y canjes) registradas por los lectores. */
@Component({
  selector: 'app-admin-interacciones',
  templateUrl: 'interacciones.page.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    MomentoPipe,
  ],
})
export class InteraccionesPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);

  readonly TODOS = TODOS;
  readonly lugares = this.catalogo.lugaresTodos;
  readonly tipo = signal(TODOS);
  readonly lugar = signal(TODOS);

  private readonly nombres = computed(
    () => new Map((this.admin.usuarios() ?? []).map((u) => [u.id, u.nombre])),
  );

  readonly cargando = computed(() => this.admin.interacciones() === undefined);
  readonly interacciones = computed(() =>
    (this.admin.interacciones() ?? []).filter(
      (i) =>
        (this.tipo() === TODOS || i.tipo === this.tipo()) &&
        (this.lugar() === TODOS || i.lugarId === this.lugar()),
    ),
  );

  usuario(id: string): string {
    return this.nombres().get(id) ?? 'Usuario';
  }

  nombreLugar(id: string): string {
    return this.catalogo.lugar(id)?.nombre ?? '(lugar eliminado)';
  }

  detalle(eventoId?: string, promocionId?: string): string {
    if (promocionId) return `Canje: ${this.catalogo.promocion(promocionId)?.titulo ?? 'promoción'}`;
    if (eventoId) return `Evento: ${this.catalogo.evento(eventoId)?.artista ?? ''}`;
    return '';
  }
}
