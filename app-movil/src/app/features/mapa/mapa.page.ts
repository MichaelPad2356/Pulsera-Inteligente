import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonRouterLink,
  IonRouterLinkWithHref,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import * as L from 'leaflet';

import { promocionVigente } from '../../core/logica/promociones';
import { ConId, Lugar, TipoLugar } from '../../core/models';
import { CatalogoService } from '../../core/services/catalogo.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { Coordenadas, distanciaMetros, formatearDistancia } from '../../core/utils/distancia';
import { diaEnAgs } from '../../core/utils/fechas';
import { TIPOS_LUGAR } from '../../core/utils/tipos-lugar';
import { BotonPerfilComponent } from '../../shared/components/boton-perfil/boton-perfil.component';
import { FechaCortaPipe } from '../../shared/pipes/fechas.pipe';

type Filtro = 'todos' | 'promociones' | TipoLugar;

/** Centro aproximado del recinto ferial, por si aún no hay lugares cargados. */
const CENTRO_FERIA: L.LatLngTuple = [21.8825, -102.3025];
const ZOOM_LUGAR = 18;

/**
 * Mapa interactivo (RF-05), ubicación del usuario (RF-06) e integración con las demás
 * secciones (RF-11): `/tabs/mapa?lugar={id}` abre el mapa centrado en ese lugar.
 * Mapa con Leaflet + OpenStreetMap (sin API key).
 */
@Component({
  selector: 'app-mapa',
  templateUrl: 'mapa.page.html',
  styleUrls: ['mapa.page.scss'],
  imports: [
    RouterLink,
    IonRouterLink,
    IonRouterLinkWithHref,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonChip,
    IonIcon,
    IonLabel,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonModal,
    IonList,
    IonItem,
    IonNote,
    BotonPerfilComponent,
    FechaCortaPipe,
  ],
})
export class MapaPage implements OnDestroy {
  private readonly catalogo = inject(CatalogoService);
  readonly ubicacion = inject(UbicacionService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');
  private mapa?: L.Map;
  private readonly capaLugares = L.layerGroup();
  private readonly marcadores = new Map<string, L.Marker>();
  private marcadorUsuario?: L.CircleMarker;
  private observadorTamano?: ResizeObserver;
  /** Lugar pedido por `?lugar=` antes de que el mapa o los datos estuvieran listos. */
  private lugarPendiente: string | null = null;

  readonly tipos = TIPOS_LUGAR;
  readonly filtros: { valor: Filtro; texto: string }[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'foro', texto: 'Foros' },
    { valor: 'pabellon', texto: 'Pabellones' },
    { valor: 'restaurante', texto: 'Restaurantes' },
    { valor: 'bar', texto: 'Bares' },
    { valor: 'hecho_en_ags', texto: 'Hecho en Ags' },
    { valor: 'promociones', texto: 'Con promoción' },
    { valor: 'otro', texto: 'Otros' },
  ];
  readonly filtro = signal<Filtro>('todos');
  readonly seleccionadoId = signal<string | null>(null);
  readonly verCercanos = signal(false);

  private readonly hoy = diaEnAgs();

  /** Ids de lugares con alguna promoción vigente (para el filtro y el distintivo). */
  private readonly conPromocion = computed(() => {
    const ids = new Set<string>();
    for (const p of this.catalogo.promociones() ?? []) {
      if (!promocionVigente(p, this.hoy)) continue;
      ids.add(p.lugarId);
      if (p.regla.tipo === 'lugares') p.regla.lugaresIds.forEach((id) => ids.add(id));
    }
    return ids;
  });

  readonly visibles = computed(() => {
    const filtro = this.filtro();
    return (this.catalogo.lugares() ?? []).filter((l) =>
      filtro === 'todos'
        ? true
        : filtro === 'promociones'
          ? this.conPromocion().has(l.id)
          : l.tipo === filtro,
    );
  });

  readonly seleccionado = computed(() => this.catalogo.lugar(this.seleccionadoId()));

  /** Lo que pasa en el lugar seleccionado: próximos eventos y actividades (RF-05). */
  readonly agendaSeleccionado = computed(() => {
    const id = this.seleccionadoId();
    if (!id) return [];
    const eventos = (this.catalogo.eventos() ?? [])
      .filter((e) => e.lugarId === id && e.fecha >= this.hoy)
      .map((e) => ({ id: e.id, titulo: e.artista, fecha: e.fecha, hora: e.hora, ruta: '/tabs/conciertos/evento' }));
    const actividades = (this.catalogo.actividades() ?? [])
      .filter((a) => a.lugarId === id && a.fecha >= this.hoy)
      .map((a) => ({ id: a.id, titulo: a.nombre, fecha: a.fecha, hora: a.hora, ruta: '/tabs/cultura/actividad' }));
    return [...eventos, ...actividades]
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
      .slice(0, 3);
  });

  readonly promocionesSeleccionado = computed(() => {
    const id = this.seleccionadoId();
    return id ? this.catalogo.promocionesDeLugar(id).filter((p) => promocionVigente(p, this.hoy)).length : 0;
  });

  /** RF-06: lugares ordenados por cercanía a la posición actual. */
  readonly cercanos = computed(() => {
    const posicion = this.ubicacion.posicion();
    if (!posicion) return [];
    return (this.catalogo.lugares() ?? [])
      .map((lugar) => ({ lugar, metros: distanciaMetros(posicion, lugar) }))
      .sort((a, b) => a.metros - b.metros)
      .slice(0, 15);
  });

  constructor() {
    // RF-11: «Ver ubicación» desde cualquier sección llega aquí con ?lugar={id}.
    this.ruta.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('lugar');
      if (id) {
        this.enfocar(id);
        // Se limpia para que volver a pulsar «Ver ubicación» del mismo lugar funcione.
        void this.router.navigate([], { queryParams: { lugar: null }, replaceUrl: true });
      }
    });

    effect(() => {
      const lugares = this.visibles();
      untracked(() => this.dibujarLugares(lugares));
    });

    effect(() => {
      const posicion = this.ubicacion.posicion();
      untracked(() => this.dibujarUsuario(posicion));
    });

    // Si se pidió un lugar antes de que cargaran los datos, se enfoca al llegar.
    effect(() => {
      if (this.catalogo.lugares() && this.lugarPendiente) {
        untracked(() => this.enfocar(this.lugarPendiente!));
      }
    });
  }

  /**
   * Ionic llama esto al terminar de mostrar la página. El mapa se crea aquí y no en
   * ngAfterViewInit: antes de este momento la página aún no está en el documento,
   * Leaflet no puede medir el contenedor y el mapa queda de 0 px de alto.
   */
  ionViewDidEnter(): void {
    if (!this.mapa) {
      this.crearMapa();
    }
    this.mapa?.invalidateSize();
    void this.ubicacion.iniciar();
  }

  ngOnDestroy(): void {
    this.observadorTamano?.disconnect();
    this.mapa?.remove();
  }

  private crearMapa(): void {
    const contenedor = this.contenedor().nativeElement;
    this.mapa = L.map(contenedor, { zoomControl: false }).setView(CENTRO_FERIA, 16);
    // Tiles de OpenStreetMap. Si algún día los bloquean, cambiar por los de CARTO
    // (https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png).
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; colaboradores de OpenStreetMap',
    }).addTo(this.mapa);
    this.capaLugares.addTo(this.mapa);
    this.mapa.on('click', () => this.seleccionadoId.set(null));

    // Si el contenedor cambia de tamaño (rotar el teléfono, teclado), el mapa se ajusta.
    this.observadorTamano = new ResizeObserver(() => this.mapa?.invalidateSize());
    this.observadorTamano.observe(contenedor);

    this.dibujarLugares(this.visibles());
    this.dibujarUsuario(this.ubicacion.posicion());
    if (this.lugarPendiente) {
      this.enfocar(this.lugarPendiente);
    } else {
      this.encuadrarTodo();
    }
  }

  elegirFiltro(filtro: Filtro): void {
    this.filtro.set(filtro);
    this.seleccionadoId.set(null);
  }

  /** Centra el mapa en un lugar y muestra su tarjeta. */
  enfocar(id: string): void {
    const lugar = this.catalogo.lugar(id);
    if (!lugar || !this.mapa) {
      this.lugarPendiente = id;
      return;
    }
    this.lugarPendiente = null;
    if (!this.visibles().some((l) => l.id === id)) {
      this.filtro.set('todos');
      this.dibujarLugares(this.visibles());
    }
    this.verCercanos.set(false);
    this.seleccionadoId.set(id);
    this.marcarSeleccionado(id);
    this.mapa.invalidateSize();
    this.mapa.setView([lugar.lat, lugar.lng], ZOOM_LUGAR, { animate: true });
  }

  async centrarEnMi(): Promise<void> {
    await this.ubicacion.iniciar();
    const posicion = this.ubicacion.posicion();
    if (posicion && this.mapa) {
      this.mapa.setView([posicion.lat, posicion.lng], 17, { animate: true });
      return;
    }
    const mensaje =
      this.ubicacion.estado() === 'denegada'
        ? 'Activa el permiso de ubicación para ver dónde estás.'
        : 'Buscando tu ubicación… inténtalo en unos segundos.';
    const aviso = await this.toast.create({ message: mensaje, duration: 2500, position: 'top' });
    await aviso.present();
  }

  distanciaA(lugar: Coordenadas): string | null {
    const posicion = this.ubicacion.posicion();
    return posicion ? formatearDistancia(distanciaMetros(posicion, lugar)) : null;
  }

  formatear(metros: number): string {
    return formatearDistancia(metros);
  }

  // --- Dibujo en Leaflet ---------------------------------------------------

  private dibujarLugares(lugares: ConId<Lugar>[]): void {
    if (!this.mapa) return;
    this.capaLugares.clearLayers();
    this.marcadores.clear();
    for (const lugar of lugares) {
      const marcador = L.marker([lugar.lat, lugar.lng], {
        icon: this.icono(lugar),
        title: lugar.nombre,
        keyboard: true,
      }).on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.seleccionadoId.set(lugar.id);
        this.marcarSeleccionado(lugar.id);
      });
      marcador.addTo(this.capaLugares);
      this.marcadores.set(lugar.id, marcador);
    }
    const seleccionado = this.seleccionadoId();
    if (seleccionado) this.marcarSeleccionado(seleccionado);
  }

  private icono(lugar: ConId<Lugar>): L.DivIcon {
    const tipo = TIPOS_LUGAR[lugar.tipo];
    const promo = this.conPromocion().has(lugar.id) ? '<span class="promo"></span>' : '';
    return L.divIcon({
      className: 'marcador-lugar',
      html: `<div class="pin" style="--color:${tipo.color}"><ion-icon name="${tipo.icono}"></ion-icon></div>${promo}`,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
    });
  }

  private marcarSeleccionado(id: string): void {
    for (const [lugarId, marcador] of this.marcadores) {
      marcador.getElement()?.classList.toggle('seleccionado', lugarId === id);
      marcador.setZIndexOffset(lugarId === id ? 1000 : 0);
    }
  }

  private dibujarUsuario(posicion: Coordenadas | null): void {
    if (!this.mapa || !posicion) return;
    if (!this.marcadorUsuario) {
      this.marcadorUsuario = L.circleMarker([posicion.lat, posicion.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#1c7ed6',
        fillOpacity: 1,
      })
        .bindTooltip('Estás aquí')
        .addTo(this.mapa);
    } else {
      this.marcadorUsuario.setLatLng([posicion.lat, posicion.lng]);
    }
  }

  private encuadrarTodo(): void {
    const lugares = this.catalogo.lugares() ?? [];
    if (this.mapa && lugares.length > 1) {
      this.mapa.fitBounds(L.latLngBounds(lugares.map((l) => [l.lat, l.lng])), { padding: [40, 40] });
    }
  }
}
