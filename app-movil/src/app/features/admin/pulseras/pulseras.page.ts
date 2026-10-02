import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonNote,
  IonSearchbar,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { mensajeDeError } from '../../../core/errores';
import { COL, ConId, Pulsera } from '../../../core/models';
import { PulserasService } from '../../../core/services/pulseras.service';
import { generarCodigo } from '../../../core/utils/pulsera';
import { MomentoPipe } from '../../../shared/pipes/fechas.pipe';
import { AdminService } from '../admin.service';

/**
 * Pulseras registradas: bloquear (si se pierde) y desvincular.
 * El alta normal se hace en el lector (modo Alta, graba el enlace en el chip);
 * aquí hay un alta manual por UID para cuando no hay celular con NFC a la mano.
 */
@Component({
  selector: 'app-admin-pulseras',
  templateUrl: 'pulseras.page.html',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonButton,
    IonInput,
    IonText,
    MomentoPipe,
  ],
})
export class PulserasPage {
  private readonly admin = inject(AdminService);
  private readonly pulserasService = inject(PulserasService);
  private readonly alertas = inject(AlertController);

  readonly busqueda = signal('');
  readonly mensaje = signal('');
  uidNuevo = '';

  private readonly usuarios = computed(
    () => new Map((this.admin.usuarios() ?? []).map((u) => [u.id, u])),
  );

  readonly pulseras = computed(() => {
    const texto = this.busqueda().trim().toUpperCase();
    return (this.admin.pulseras() ?? [])
      .filter(
        (p) =>
          !texto ||
          p.codigo.includes(texto) ||
          p.id.includes(texto) ||
          (this.dueno(p.usuarioId) ?? '').toUpperCase().includes(texto),
      )
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  readonly vinculadas = computed(() => (this.admin.pulseras() ?? []).filter((p) => p.usuarioId).length);

  dueno(usuarioId: string | null): string | null {
    if (!usuarioId) return null;
    const usuario = this.usuarios().get(usuarioId);
    return usuario ? `${usuario.nombre} (${usuario.email})` : 'Usuario';
  }

  alternarBloqueo(pulsera: ConId<Pulsera>): void {
    void this.admin.actualizar(COL.pulseras, pulsera.id, {
      estado: pulsera.estado === 'activa' ? 'bloqueada' : 'activa',
    });
  }

  async desvincular(pulsera: ConId<Pulsera>): Promise<void> {
    const confirmar = await this.alertas.create({
      header: 'Desvincular pulsera',
      message: `La pulsera ${pulsera.codigo} quedará libre. El historial del usuario se conserva.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desvincular',
          handler: () =>
            void this.admin.actualizar(COL.pulseras, pulsera.id, { usuarioId: null, vinculadaEn: null }),
        },
      ],
    });
    await confirmar.present();
  }

  /** Alta manual con el UID leído con otra app (ej. NFC Tools). No graba el enlace en el chip. */
  async registrarManual(): Promise<void> {
    const uid = this.uidNuevo.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (uid.length < 8) {
      this.mensaje.set('El UID debe tener al menos 8 caracteres hexadecimales (ej. 04:A1:B2:C3…).');
      return;
    }
    try {
      if (await this.pulserasService.buscar({ uid })) {
        this.mensaje.set('Esa pulsera ya está registrada.');
        return;
      }
      const codigo = generarCodigo();
      await this.pulserasService.registrar(uid, codigo);
      this.mensaje.set(`Registrada con el código ${codigo}. Escríbelo en la pulsera.`);
      this.uidNuevo = '';
    } catch (e) {
      this.mensaje.set(mensajeDeError(e));
    }
  }
}
