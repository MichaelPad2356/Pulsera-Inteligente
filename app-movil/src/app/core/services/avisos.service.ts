import { Injectable, effect, inject, untracked } from '@angular/core';
import { ToastController } from '@ionic/angular';

import { AuthService } from './auth.service';
import { CatalogoService } from './catalogo.service';
import { HistorialService } from './historial.service';
import { ProgresoService } from './progreso.service';

/**
 * Avisos en vivo para el visitante (RF-10: el progreso se actualiza solo).
 * Cuando el lector del establecimiento registra su visita, en su teléfono aparece
 * «Visita registrada» y, si completó una promoción, «¡Desbloqueaste…!».
 * Se activa al entrar a las pestañas (TabsPage).
 */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly auth = inject(AuthService);
  private readonly catalogo = inject(CatalogoService);
  private readonly historial = inject(HistorialService);
  private readonly progresos = inject(ProgresoService);
  private readonly toast = inject(ToastController);

  constructor() {
    // Interacciones nuevas. La primera carga no avisa: solo lo que llega después.
    let usuario: string | null = null;
    let conocidas: Set<string> | null = null;
    effect(() => {
      const uid = this.auth.uid();
      const lista = this.historial.interacciones();
      if (uid !== usuario) {
        usuario = uid;
        conocidas = null;
      }
      if (!lista) return;
      if (conocidas) {
        for (const nueva of lista.filter((i) => !conocidas!.has(i.id))) {
          untracked(() => {
            const lugar = this.catalogo.lugar(nueva.lugarId)?.nombre ?? 'un lugar';
            void this.avisar(
              nueva.tipo === 'visita' ? `Visita registrada en ${lugar}` : `Promoción canjeada en ${lugar}`,
              'primary',
            );
          });
        }
      }
      conocidas = new Set(lista.map((i) => i.id));
    });

    // Promociones que pasan a «desbloqueada».
    let estados: Map<string, string> | null = null;
    let usuarioProgreso: string | null = null;
    effect(() => {
      const uid = this.auth.uid();
      const progresos = this.progresos.progresos();
      if (uid !== usuarioProgreso) {
        usuarioProgreso = uid;
        estados = null;
      }
      if (!progresos) return;
      if (estados) {
        for (const p of progresos) {
          if (p.estado === 'desbloqueada' && estados.get(p.id) !== 'desbloqueada') {
            untracked(() => {
              const titulo = this.catalogo.promocion(p.id)?.titulo ?? 'una promoción';
              void this.avisar(`¡Desbloqueaste «${titulo}»!`, 'success', 'top');
            });
          }
        }
      }
      estados = new Map(progresos.map((p) => [p.id, p.estado]));
    });
  }

  private async avisar(
    mensaje: string,
    color: 'primary' | 'success',
    posicion: 'top' | 'bottom' = 'bottom',
  ): Promise<void> {
    const aviso = await this.toast.create({
      message: mensaje,
      color,
      duration: 3500,
      position: posicion,
      positionAnchor: posicion === 'bottom' ? 'barra-pestanas' : undefined,
      icon: color === 'success' ? 'sparkles' : 'checkmark-circle',
    });
    await aviso.present();
  }
}
