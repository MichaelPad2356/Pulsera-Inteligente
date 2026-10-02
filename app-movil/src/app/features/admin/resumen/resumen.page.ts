import { Component, computed, inject } from '@angular/core';
import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CatalogoService } from '../../../core/services/catalogo.service';
import { diaEnAgs, fechaCorta } from '../../../core/utils/fechas';
import { AdminService } from '../admin.service';
import { DatoGrafica, GraficaBarrasComponent } from '../components/grafica-barras.component';

const DIAS_GRAFICA = 7;
const LUGARES_GRAFICA = 10;

/** RF-12: estadísticas básicas del sistema. */
@Component({
  selector: 'app-admin-resumen',
  templateUrl: 'resumen.page.html',
  styleUrls: ['resumen.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    GraficaBarrasComponent,
  ],
})
export class ResumenPage {
  private readonly admin = inject(AdminService);
  private readonly catalogo = inject(CatalogoService);

  readonly cargando = computed(
    () =>
      this.admin.interacciones() === undefined ||
      this.admin.usuarios() === undefined ||
      this.admin.pulseras() === undefined ||
      this.admin.progresos() === undefined,
  );

  private readonly visitas = computed(() =>
    (this.admin.interacciones() ?? []).filter((i) => i.tipo === 'visita'),
  );

  // --- Números principales ---
  readonly totalVisitas = computed(() => this.visitas().length);
  readonly visitasHoy = computed(() => {
    const hoy = diaEnAgs();
    return this.visitas().filter((v) => v.dia === hoy).length;
  });
  readonly visitantes = computed(
    () => (this.admin.usuarios() ?? []).filter((u) => u.rol === 'visitante').length,
  );
  readonly pulseras = computed(() => {
    const todas = this.admin.pulseras() ?? [];
    return { total: todas.length, vinculadas: todas.filter((p) => p.usuarioId).length };
  });
  readonly desbloqueadas = computed(
    () => (this.admin.progresos() ?? []).filter((p) => p.estado !== 'en_progreso').length,
  );
  readonly canjeadas = computed(
    () => (this.admin.progresos() ?? []).filter((p) => p.estado === 'utilizada').length,
  );
  readonly limiteAlcanzado = computed(() => (this.admin.interacciones() ?? []).length >= 1000);

  /** Lugares más visitados (ranking). */
  readonly visitasPorLugar = computed<DatoGrafica[]>(() => {
    const conteo = new Map<string, number>();
    for (const v of this.visitas()) conteo.set(v.lugarId, (conteo.get(v.lugarId) ?? 0) + 1);
    return [...conteo]
      .sort((a, b) => b[1] - a[1])
      .slice(0, LUGARES_GRAFICA)
      .map(([lugarId, valor]) => ({ etiqueta: this.catalogo.lugar(lugarId)?.nombre ?? lugarId, valor }));
  });

  /** Visitas de los últimos 7 días, de más antiguo a hoy. */
  readonly visitasPorDia = computed<DatoGrafica[]>(() => {
    const conteo = new Map<string, number>();
    for (const v of this.visitas()) conteo.set(v.dia, (conteo.get(v.dia) ?? 0) + 1);
    const hoy = Date.now();
    return Array.from({ length: DIAS_GRAFICA }, (_, i) => {
      const dia = diaEnAgs(new Date(hoy - (DIAS_GRAFICA - 1 - i) * 86_400_000));
      return { etiqueta: fechaCorta(dia), valor: conteo.get(dia) ?? 0 };
    });
  });

  /** Por promoción: cuántos la desbloquearon y cuántos la canjearon. */
  readonly promociones = computed(() => {
    const progresos = this.admin.progresos() ?? [];
    return (this.catalogo.promocionesTodas() ?? []).map((p) => {
      const suyos = progresos.filter((pr) => pr.id === p.id);
      return {
        id: p.id,
        titulo: p.titulo,
        activa: p.activa,
        enProgreso: suyos.filter((pr) => pr.estado === 'en_progreso').length,
        desbloqueadas: suyos.filter((pr) => pr.estado !== 'en_progreso').length,
        canjeadas: suyos.filter((pr) => pr.estado === 'utilizada').length,
      };
    });
  });
}
