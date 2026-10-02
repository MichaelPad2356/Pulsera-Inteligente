import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

import { Coordenadas } from '../utils/distancia';

export type EstadoUbicacion = 'inactiva' | 'buscando' | 'activa' | 'denegada' | 'no_disponible';

/**
 * Ubicación del usuario por GPS (RF-05, RF-06). Pide permiso la primera vez:
 * en Android con el diálogo nativo, en la PWA con el del navegador.
 */
@Injectable({ providedIn: 'root' })
export class UbicacionService {
  readonly posicion = signal<Coordenadas | null>(null);
  readonly estado = signal<EstadoUbicacion>('inactiva');
  private idSeguimiento: string | null = null;

  async iniciar(): Promise<void> {
    if (this.idSeguimiento) {
      return;
    }
    this.estado.set('buscando');
    try {
      if (Capacitor.isNativePlatform()) {
        const permiso = await Geolocation.requestPermissions({ permissions: ['location'] });
        if (permiso.location === 'denied') {
          this.estado.set('denegada');
          return;
        }
      }
      this.idSeguimiento = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 },
        (posicion, error) => {
          if (posicion) {
            this.posicion.set({ lat: posicion.coords.latitude, lng: posicion.coords.longitude });
            this.estado.set('activa');
          } else if (error) {
            this.estado.set(esPermisoDenegado(error) ? 'denegada' : 'no_disponible');
          }
        },
      );
    } catch (error) {
      this.estado.set(esPermisoDenegado(error) ? 'denegada' : 'no_disponible');
    }
  }

  async detener(): Promise<void> {
    if (this.idSeguimiento) {
      await Geolocation.clearWatch({ id: this.idSeguimiento });
      this.idSeguimiento = null;
    }
  }
}

function esPermisoDenegado(error: unknown): boolean {
  const e = error as { code?: number | string; message?: string };
  return e?.code === 1 || /denied|permission/i.test(e?.message ?? '');
}
