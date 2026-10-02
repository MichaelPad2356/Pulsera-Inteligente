import { Component, OnDestroy, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonRouterLink,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { mensajeDeError } from '../../../core/errores';
import { EstadoNfc, NfcService } from '../../../core/services/nfc.service';
import { IdentificacionPulsera, PulserasService } from '../../../core/services/pulseras.service';
import { LARGO_CODIGO, normalizarCodigo } from '../../../core/utils/pulsera';

type Paso = 'inicio' | 'escaneando' | 'procesando' | 'listo' | 'error';

/**
 * Vincular la pulsera a la cuenta (RF-01). Tres formas, todas llegan a lo mismo:
 * - Acercar la pulsera al teléfono dentro de la app (Android).
 * - Acercarla con la app cerrada: el teléfono abre el enlace grabado `/p/{codigo}`,
 *   que redirige aquí con `?codigo=` (iPhone XS o más nuevo y Android).
 * - Escribir el código impreso en la pulsera.
 */
@Component({
  selector: 'app-vincular-pulsera',
  templateUrl: 'vincular-pulsera.page.html',
  styleUrls: ['vincular-pulsera.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonInput,
    IonSpinner,
    IonText,
  ],
})
export class VincularPulseraPage implements OnDestroy {
  private readonly pulseras = inject(PulserasService);
  private readonly nfc = inject(NfcService);

  /** Viene del enlace grabado en la pulsera (`/p/{codigo}` → `?codigo=`). */
  readonly codigo = input<string>();

  readonly LARGO_CODIGO = LARGO_CODIGO;
  readonly esNativo = this.nfc.esNativo;
  readonly miPulsera = this.pulseras.miPulsera;
  readonly estadoNfc = signal<EstadoNfc>('sin_nfc');
  readonly paso = signal<Paso>('inicio');
  readonly mensaje = signal('');
  codigoEscrito = '';

  private detenerLectura: (() => Promise<void>) | null = null;
  private codigoDelEnlace: string | null = null;

  constructor() {
    void this.nfc.estado().then((estado) => this.estadoNfc.set(estado));

    // Llegó desde el enlace de la pulsera: se vincula sola.
    effect(() => {
      const codigo = this.codigo();
      if (codigo && codigo !== this.codigoDelEnlace) {
        this.codigoDelEnlace = codigo;
        untracked(() => void this.vincular({ codigo: normalizarCodigo(codigo) }));
      }
    });
  }

  async acercarPulsera(): Promise<void> {
    if (this.estadoNfc() === 'apagado') {
      await this.nfc.abrirAjustes();
      return;
    }
    this.paso.set('escaneando');
    try {
      this.detenerLectura = await this.nfc.escuchar(async (lectura) => {
        await this.dejarDeLeer();
        await this.vincular({ uid: lectura.uid, codigo: lectura.codigo });
      });
    } catch (e) {
      this.paso.set('error');
      this.mensaje.set(mensajeDeError(e));
    }
  }

  async cancelar(): Promise<void> {
    await this.dejarDeLeer();
    this.paso.set('inicio');
  }

  async vincularConCodigo(): Promise<void> {
    const codigo = normalizarCodigo(this.codigoEscrito);
    if (codigo.length !== LARGO_CODIGO) {
      this.paso.set('error');
      this.mensaje.set(`El código tiene ${LARGO_CODIGO} letras y números.`);
      return;
    }
    await this.vincular({ codigo });
  }

  ionViewWillLeave(): void {
    void this.dejarDeLeer();
  }

  ngOnDestroy(): void {
    void this.dejarDeLeer();
  }

  private async vincular(identificacion: IdentificacionPulsera): Promise<void> {
    this.paso.set('procesando');
    try {
      const resultado = await this.pulseras.vincular(identificacion);
      this.paso.set('listo');
      this.mensaje.set(
        resultado === 'ya_era_tuya'
          ? 'Esta pulsera ya estaba vinculada a tu cuenta.'
          : '¡Listo! Tu pulsera quedó vinculada a tu cuenta.',
      );
      this.codigoEscrito = '';
    } catch (e) {
      this.paso.set('error');
      this.mensaje.set(mensajeDeError(e));
    }
  }

  private async dejarDeLeer(): Promise<void> {
    const detener = this.detenerLectura;
    this.detenerLectura = null;
    await detener?.();
  }
}
