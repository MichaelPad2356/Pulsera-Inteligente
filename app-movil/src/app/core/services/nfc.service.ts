import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorNfc, NfcEvent } from '@capgo/capacitor-nfc';

import { codigoDeEnlace, enlaceDeRegistros, registroEnlace, uidAHex } from '../utils/pulsera';

/** Lo que se leyó de una pulsera. */
export interface LecturaNfc {
  /** UID del chip en hex mayúsculas = id en `pulseras`. */
  uid: string;
  /** Enlace grabado en la pulsera, si tiene. */
  enlace: string | null;
  /** Código sacado del enlace, si tiene. */
  codigo: string | null;
}

export type EstadoNfc = 'listo' | 'apagado' | 'sin_nfc';

/** Ignora la misma pulsera si se sigue sosteniendo junto al lector. */
const ESPERA_MISMA_PULSERA_MS = 3000;

/**
 * Lectura y escritura de pulseras NFC (RF-07). Solo funciona en la app nativa de Android;
 * en la PWA (iPhone) no hay NFC y las pantallas ofrecen escribir el código.
 */
@Injectable({ providedIn: 'root' })
export class NfcService {
  readonly esNativo = Capacitor.isNativePlatform();

  async estado(): Promise<EstadoNfc> {
    if (!this.esNativo) {
      return 'sin_nfc';
    }
    try {
      const { status } = await CapacitorNfc.getStatus();
      if (status === 'NFC_OK') return 'listo';
      if (status === 'NFC_DISABLED') return 'apagado';
      return 'sin_nfc';
    } catch {
      return 'sin_nfc';
    }
  }

  abrirAjustes(): Promise<void> {
    return CapacitorNfc.showSettings();
  }

  /** Empieza a leer pulseras. Regresa una función para dejar de leer. */
  async escuchar(alLeer: (lectura: LecturaNfc) => void): Promise<() => Promise<void>> {
    let ultimoUid = '';
    let ultimoMomento = 0;
    const suscripcion = await CapacitorNfc.addListener('nfcEvent', (evento) => {
      const lectura = leerEvento(evento);
      if (!lectura) return;
      const ahora = Date.now();
      if (lectura.uid === ultimoUid && ahora - ultimoMomento < ESPERA_MISMA_PULSERA_MS) return;
      ultimoUid = lectura.uid;
      ultimoMomento = ahora;
      alLeer(lectura);
    });
    await CapacitorNfc.startScanning({ invalidateAfterFirstRead: false });
    return async () => {
      await suscripcion.remove();
      await CapacitorNfc.stopScanning().catch(() => undefined);
    };
  }

  /** Graba un enlace en la última pulsera leída (debe seguir junto al teléfono). */
  async escribirEnlace(url: string): Promise<void> {
    await CapacitorNfc.write({ records: [registroEnlace(url)] });
  }
}

function leerEvento(evento: NfcEvent): LecturaNfc | null {
  const id = evento.tag?.id;
  if (!id?.length) {
    return null;
  }
  const enlace = enlaceDeRegistros(evento.tag.ndefMessage);
  return { uid: uidAHex(id), enlace, codigo: enlace ? codigoDeEnlace(enlace) : null };
}
