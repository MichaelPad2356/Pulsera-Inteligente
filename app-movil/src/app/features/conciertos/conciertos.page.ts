import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRouterLink,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CatalogoService } from '../../core/services/catalogo.service';
import { diaEnAgs, nombreDia } from '../../core/utils/fechas';
import { BotonMapaComponent } from '../../shared/components/boton-mapa/boton-mapa.component';
import { BotonPerfilComponent } from '../../shared/components/boton-perfil/boton-perfil.component';
import { EstadoVacioComponent } from '../../shared/components/estado-vacio/estado-vacio.component';
import { FechaCortaPipe } from '../../shared/pipes/fechas.pipe';

const TODOS = 'todos';
const OTROS = 'otros';

/**
 * RF-04: eventos organizados por foro (Foro del Lago, Foro de las Estrellas, Palenque
 * y otros eventos), con filtros por fecha, artista y foro.
 */
@Component({
  selector: 'app-conciertos',
  templateUrl: 'conciertos.page.html',
  styleUrls: ['conciertos.page.scss'],
  imports: [
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonList,
    IonListHeader,
    IonItem,
    IonIcon,
    IonSpinner,
    BotonPerfilComponent,
    BotonMapaComponent,
    EstadoVacioComponent,
    FechaCortaPipe,
  ],
})
export class ConciertosPage {
  private readonly catalogo = inject(CatalogoService);

  readonly TODOS = TODOS;
  readonly OTROS = OTROS;
  readonly cargando = this.catalogo.cargando;

  // Filtros
  readonly dia = signal(TODOS);
  readonly foro = signal(TODOS);
  readonly artista = signal('');

  /** Lugares de tipo foro: cada uno es una sección; lo demás va en «Otros eventos». */
  readonly foros = computed(() =>
    (this.catalogo.lugares() ?? []).filter((l) => l.tipo === 'foro'),
  );

  private readonly proximos = computed(() => {
    const hoy = diaEnAgs();
    return (this.catalogo.eventos() ?? []).filter((e) => e.fecha >= hoy);
  });

  /** Días con eventos, para los chips (Viernes, Sábado, …). */
  readonly dias = computed(() => [...new Set(this.proximos().map((e) => e.fecha))]);

  readonly secciones = computed(() => {
    const busqueda = this.artista().trim().toLocaleLowerCase('es');
    const idsForos = new Set(this.foros().map((f) => f.id));
    const filtrados = this.proximos().filter(
      (e) =>
        (this.dia() === TODOS || e.fecha === this.dia()) &&
        (!busqueda || e.artista.toLocaleLowerCase('es').includes(busqueda)) &&
        (this.foro() === TODOS ||
          e.lugarId === this.foro() ||
          (this.foro() === OTROS && !idsForos.has(e.lugarId))),
    );
    return [
      ...this.foros().map((f) => ({
        id: f.id,
        titulo: f.nombre,
        eventos: filtrados.filter((e) => e.lugarId === f.id),
      })),
      {
        id: OTROS,
        titulo: 'Otros eventos',
        eventos: filtrados.filter((e) => !idsForos.has(e.lugarId)),
      },
    ].filter((s) => s.eventos.length > 0);
  });

  nombreDia(dia: string): string {
    return nombreDia(dia);
  }

  nombreLugar(id: string): string {
    return this.catalogo.lugar(id)?.nombre ?? '';
  }

  limpiarFiltros(): void {
    this.dia.set(TODOS);
    this.foro.set(TODOS);
    this.artista.set('');
  }
}
