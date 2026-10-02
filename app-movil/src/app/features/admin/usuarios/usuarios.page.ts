import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { mensajeDeError } from '../../../core/errores';
import { COL, ConId, Rol, Usuario } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { AdminService } from '../admin.service';

/**
 * Usuarios y roles. Aquí se convierte una cuenta en «establecimiento» y se le asigna
 * el lugar donde está su lector.
 */
@Component({
  selector: 'app-admin-usuarios',
  templateUrl: 'usuarios.page.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
  ],
})
export class UsuariosPage {
  private readonly admin = inject(AdminService);
  private readonly catalogo = inject(CatalogoService);
  private readonly toast = inject(ToastController);
  readonly miUid = inject(AuthService).uid;

  readonly lugares = this.catalogo.lugaresTodos;
  readonly busqueda = signal('');
  readonly usuarios = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es');
    return (this.admin.usuarios() ?? [])
      .filter(
        (u) =>
          !texto ||
          u.nombre.toLocaleLowerCase('es').includes(texto) ||
          u.email.toLocaleLowerCase('es').includes(texto),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  });

  async cambiarRol(usuario: ConId<Usuario>, rol: Rol): Promise<void> {
    if (rol === usuario.rol) return;
    await this.guardar(usuario, { rol, lugarId: rol === 'establecimiento' ? (usuario.lugarId ?? null) : null });
  }

  async cambiarLugar(usuario: ConId<Usuario>, lugarId: string): Promise<void> {
    await this.guardar(usuario, { lugarId });
  }

  private async guardar(usuario: ConId<Usuario>, cambios: Record<string, unknown>): Promise<void> {
    try {
      await this.admin.actualizar(COL.usuarios, usuario.id, cambios);
    } catch (e) {
      const aviso = await this.toast.create({ message: mensajeDeError(e), duration: 3000, color: 'danger' });
      await aviso.present();
    }
  }
}
