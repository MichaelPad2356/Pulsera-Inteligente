import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Haptics, NotificationType } from '@capacitor/haptics';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRouterLink,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { environment } from '../../../../environments/environment';
import { ErrorConMensaje, mensajeDeError } from '../../../core/errores';
import { ConId, Promocion } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { DatosCanje, LectorService, ResultadoVisita } from '../../../core/services/lector.service';
import { EstadoNfc, LecturaNfc, NfcService } from '../../../core/services/nfc.service';
import { IdentificacionPulsera, PulserasService } from '../../../core/services/pulseras.service';
import { enlacePulsera, generarCodigo, normalizarCodigo } from '../../../core/utils/pulsera';

type Modo = 'visita' | 'canje' | 'alta';

type Resultado =
  | { tipo: 'visita'; datos: ResultadoVisita }
  | { tipo: 'canje'; pulseraId: string; datos: DatosCanje }
  | { tipo: 'canjeada'; nombre: string; titulo: string }
  | { tipo: 'alta'; codigo: string; nueva: boolean; grabada: boolean; vinculada: boolean }
  | { tipo: 'error'; mensaje: string };

/**
 * Modo establecimiento (RF-07): el celular Android del establecimiento lee la pulsera.
 * - Visita: registra la visita (lugar, fecha y hora) y actualiza el progreso del usuario.
 * - Canje: muestra las promociones desbloqueadas del usuario y las marca como utilizadas.
 * - Alta (solo admin): graba el enlace en un sticker nuevo y lo registra en el sistema.
 * Sin NFC (navegador, pruebas) se puede escribir el código de la pulsera.
 */
@Component({
  selector: 'app-lector',
  templateUrl: 'lector.page.html',
  styleUrls: ['lector.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonList,
    IonIcon,
    IonInput,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonText,
  ],
})
export class LectorPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly catalogo = inject(CatalogoService);
  private readonly lector = inject(LectorService);
  private readonly pulseras = inject(PulserasService);
  private readonly nfc = inject(NfcService);
  private readonly router = inject(Router);

  readonly esAdmin = computed(() => this.auth.rol() === 'admin');
  readonly modo = signal<Modo>('visita');
  readonly estadoNfc = signal<EstadoNfc | null>(null);
  readonly procesando = signal(false);
  readonly resultado = signal<Resultado | null>(null);
  codigoEscrito = '';

  /** El admin elige el lugar (útil para la demo con un solo celular); el establecimiento tiene el suyo. */
  readonly lugarElegido = signal<string | null>(null);
  readonly lugarId = computed(() =>
    this.esAdmin() ? this.lugarElegido() : (this.auth.perfil()?.lugarId ?? null),
  );
  readonly lugar = computed(() => this.catalogo.lugar(this.lugarId()));
  readonly lugares = this.catalogo.lugares;

  private detenerLectura: (() => Promise<void>) | null = null;

  async ionViewWillEnter(): Promise<void> {
    const estado = await this.nfc.estado();
    this.estadoNfc.set(estado);
    if (estado === 'listo' && !this.detenerLectura) {
      this.detenerLectura = await this.nfc.escuchar((lectura) => void this.alLeer(lectura));
    }
  }

  ionViewWillLeave(): void {
    void this.dejarDeLeer();
  }

  ngOnDestroy(): void {
    void this.dejarDeLeer();
  }

  cambiarModo(modo: Modo): void {
    this.modo.set(modo);
    this.resultado.set(null);
  }

  abrirAjustesNfc(): void {
    void this.nfc.abrirAjustes();
  }

  /** Sin NFC: el código impreso en la pulsera. */
  async usarCodigo(): Promise<void> {
    const codigo = normalizarCodigo(this.codigoEscrito);
    if (!codigo) return;
    this.codigoEscrito = '';
    await this.procesar({ codigo });
  }

  async canjear(pulseraId: string, promocion: ConId<Promocion>, nombre: string): Promise<void> {
    const lugarId = this.lugarId();
    if (!lugarId || this.procesando()) return;
    this.procesando.set(true);
    try {
      await this.lector.canjear(pulseraId, promocion.id, lugarId);
      this.resultado.set({ tipo: 'canjeada', nombre, titulo: promocion.titulo });
      void vibrar(true);
    } catch (e) {
      this.mostrarError(e);
    } finally {
      this.procesando.set(false);
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.dejarDeLeer();
    await this.auth.cerrarSesion();
    await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  private async alLeer(lectura: LecturaNfc): Promise<void> {
    if (this.procesando()) return;
    if (this.modo() === 'alta') {
      await this.darDeAlta(lectura);
    } else {
      await this.procesar({ uid: lectura.uid, codigo: lectura.codigo });
    }
  }

  private async procesar(identificacion: IdentificacionPulsera): Promise<void> {
    const lugarId = this.lugarId();
    if (!lugarId) {
      this.resultado.set({ tipo: 'error', mensaje: 'Primero elige el lugar de este lector.' });
      return;
    }
    if (this.modo() === 'alta') {
      this.resultado.set({ tipo: 'error', mensaje: 'Para dar de alta hay que leer la pulsera con NFC.' });
      return;
    }
    this.procesando.set(true);
    this.resultado.set(null);
    try {
      const pulseraId = await this.lector.identificar(identificacion);
      if (this.modo() === 'visita') {
        const datos = await this.lector.registrarVisita(pulseraId, lugarId);
        this.resultado.set({ tipo: 'visita', datos });
        void vibrar(datos.tipo === 'registrada');
      } else {
        const datos = await this.lector.paraCanje(pulseraId, lugarId);
        this.resultado.set({ tipo: 'canje', pulseraId, datos });
      }
    } catch (e) {
      this.mostrarError(e);
    } finally {
      this.procesando.set(false);
    }
  }

  /** Graba el enlace en el sticker (si hace falta) y lo registra. La pulsera debe seguir junto al teléfono. */
  private async darDeAlta(lectura: LecturaNfc): Promise<void> {
    this.procesando.set(true);
    this.resultado.set(null);
    try {
      const existente = await this.pulseras.buscar({ uid: lectura.uid });
      const codigo = existente?.codigo ?? generarCodigo();
      const enlace = enlacePulsera(environment.urlPublica, codigo);
      let grabada = lectura.enlace === enlace;
      if (!grabada) {
        try {
          await this.nfc.escribirEnlace(enlace);
          grabada = true;
        } catch {
          grabada = false;
        }
      }
      if (!existente) {
        if (!grabada) {
          throw new ErrorConMensaje(
            'No se pudo grabar la pulsera. Mantenla junto al teléfono e inténtalo de nuevo.',
          );
        }
        await this.pulseras.registrar(lectura.uid, codigo);
      }
      this.resultado.set({
        tipo: 'alta',
        codigo,
        nueva: !existente,
        grabada,
        vinculada: !!existente?.usuarioId,
      });
      void vibrar(grabada);
    } catch (e) {
      this.mostrarError(e);
    } finally {
      this.procesando.set(false);
    }
  }

  private mostrarError(error: unknown): void {
    this.resultado.set({ tipo: 'error', mensaje: mensajeDeError(error) });
    void vibrar(false);
  }

  private async dejarDeLeer(): Promise<void> {
    const detener = this.detenerLectura;
    this.detenerLectura = null;
    await detener?.();
  }
}

/** Vibración corta de éxito o error (en navegador no hace nada). */
async function vibrar(exito: boolean): Promise<void> {
  try {
    await Haptics.notification({ type: exito ? NotificationType.Success : NotificationType.Error });
  } catch {
    // Sin vibración disponible.
  }
}
