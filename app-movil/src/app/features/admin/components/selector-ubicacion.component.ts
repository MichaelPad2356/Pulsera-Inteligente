import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';

import { Coordenadas } from '../../../core/utils/distancia';

/**
 * Mapa para fijar las coordenadas de un lugar (RF-12): tocar el mapa o arrastrar el marcador.
 * Uso: <app-selector-ubicacion [(posicion)]="posicion" />
 */
@Component({
  selector: 'app-selector-ubicacion',
  template: `
    <div #contenedor class="mapa"></div>
    <p class="ayuda">Toca el mapa o arrastra el marcador para fijar la ubicación.</p>
  `,
  styles: `
    .mapa { height: 320px; border-radius: 12px; overflow: hidden; }
    .ayuda { font-size: 0.85rem; color: var(--ion-color-medium); }
  `,
})
export class SelectorUbicacionComponent implements AfterViewInit, OnDestroy {
  readonly posicion = model.required<Coordenadas>();

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');
  private mapa?: L.Map;
  private marcador?: L.Marker;
  private observador?: ResizeObserver;

  constructor() {
    // Si cambian las coordenadas desde fuera (campos numéricos), se mueve el marcador.
    effect(() => {
      const { lat, lng } = this.posicion();
      untracked(() => {
        this.marcador?.setLatLng([lat, lng]);
        if (this.mapa && !this.mapa.getBounds().contains([lat, lng])) {
          this.mapa.panTo([lat, lng]);
        }
      });
    });
  }

  ngAfterViewInit(): void {
    const { lat, lng } = this.posicion();
    const elemento = this.contenedor().nativeElement;
    this.mapa = L.map(elemento).setView([lat, lng], 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; colaboradores de OpenStreetMap',
    }).addTo(this.mapa);

    this.marcador = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({
        className: 'marcador-lugar seleccionado',
        html: '<div class="pin" style="--color:#3880ff"><ion-icon name="location"></ion-icon></div>',
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      }),
    }).addTo(this.mapa);

    this.marcador.on('dragend', () => this.fijar(this.marcador!.getLatLng()));
    this.mapa.on('click', (e: L.LeafletMouseEvent) => this.fijar(e.latlng));

    // Dentro de las transiciones de Ionic el mapa nace con tamaño 0: se ajusta al cambiar.
    this.observador = new ResizeObserver(() => this.mapa?.invalidateSize());
    this.observador.observe(elemento);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    this.mapa?.remove();
  }

  private fijar({ lat, lng }: L.LatLng): void {
    // 6 decimales ≈ 10 cm: más que suficiente.
    this.posicion.set({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
  }
}
