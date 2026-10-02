import { Component, computed, input, signal } from '@angular/core';

export interface DatoGrafica {
  etiqueta: string;
  valor: number;
}

interface Punto extends DatoGrafica {
  /** 0–100, largo de la barra respecto al máximo. */
  porcentaje: number;
  /** Parte del total, para el tooltip. */
  participacion: number;
}

/**
 * Gráfica de barras de una sola serie para las estadísticas del panel.
 * - horizontal: ranking (ej. visitas por lugar); vertical: columnas en el tiempo (visitas por día).
 * Un solo color (slot 1 de la paleta validada), valor en la punta de cada barra, tooltip al pasar
 * el cursor o con el teclado, y botón para verla como tabla.
 */
@Component({
  selector: 'app-grafica-barras',
  templateUrl: 'grafica-barras.component.html',
  styleUrls: ['grafica-barras.component.scss'],
})
export class GraficaBarrasComponent {
  readonly datos = input.required<DatoGrafica[]>();
  readonly orientacion = input<'horizontal' | 'vertical'>('horizontal');
  /** Para los textos: «12 visitas». */
  readonly unidad = input('visitas');

  readonly verTabla = signal(false);
  readonly resaltado = signal<number | null>(null);

  readonly puntos = computed<Punto[]>(() => {
    const datos = this.datos();
    const maximo = Math.max(1, ...datos.map((d) => d.valor));
    const total = datos.reduce((suma, d) => suma + d.valor, 0) || 1;
    return datos.map((d) => ({
      ...d,
      porcentaje: (d.valor / maximo) * 100,
      participacion: Math.round((d.valor / total) * 100),
    }));
  });

  readonly vacia = computed(() => this.datos().every((d) => d.valor === 0));

  descripcion(p: Punto): string {
    return `${p.etiqueta}: ${p.valor} ${this.unidad()} (${p.participacion}% del total)`;
  }
}
