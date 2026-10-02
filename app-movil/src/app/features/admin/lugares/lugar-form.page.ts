import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { mensajeDeError } from '../../../core/errores';
import { COL, Lugar, TipoLugar } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Coordenadas } from '../../../core/utils/distancia';
import { TIPOS_LUGAR } from '../../../core/utils/tipos-lugar';
import { AdminService } from '../admin.service';
import { SelectorUbicacionComponent } from '../components/selector-ubicacion.component';

const CENTRO_FERIA: Coordenadas = { lat: 21.8825, lng: -102.3025 };

/** RF-12: crear o editar un lugar, incluidas sus coordenadas (con el mapa). */
@Component({
  selector: 'app-admin-lugar-form',
  templateUrl: 'lugar-form.page.html',
  styleUrls: ['../admin-form.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonButton,
    IonIcon,
    IonText,
    SelectorUbicacionComponent,
  ],
})
export class LugarFormPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  /** 'nuevo' o el id del lugar (de la ruta). */
  readonly id = input.required<string>();
  readonly esNuevo = computed(() => this.id() === 'nuevo');

  readonly tipos = Object.entries(TIPOS_LUGAR) as [TipoLugar, (typeof TIPOS_LUGAR)[TipoLugar]][];
  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', Validators.required],
    tipo: ['restaurante' as TipoLugar, Validators.required],
    descripcion: [''],
    horario: [''],
    imagen: [''],
    activo: [true],
    lat: [CENTRO_FERIA.lat, [Validators.required, Validators.min(-90), Validators.max(90)]],
    lng: [CENTRO_FERIA.lng, [Validators.required, Validators.min(-180), Validators.max(180)]],
  });
  /** Coordenadas compartidas entre el mapa y los campos numéricos. */
  readonly posicion = signal<Coordenadas>(CENTRO_FERIA);
  readonly guardando = signal(false);
  readonly error = signal('');
  private cargado = false;

  constructor() {
    // Al editar, llena el formulario cuando llegan los datos.
    effect(() => {
      const lugar = this.esNuevo() ? undefined : this.catalogo.lugar(this.id());
      if (lugar && !this.cargado) {
        this.cargado = true;
        untracked(() => {
          this.form.reset({ imagen: '', ...lugar });
          this.posicion.set({ lat: lugar.lat, lng: lugar.lng });
        });
      }
    });
    // Del mapa a los campos.
    effect(() => {
      const { lat, lng } = this.posicion();
      untracked(() => this.form.patchValue({ lat, lng }, { emitEvent: false }));
    });
  }

  /** De los campos numéricos al mapa. */
  coordenadasEscritas(): void {
    const { lat, lng } = this.form.getRawValue();
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.posicion.set({ lat: Number(lat), lng: Number(lng) });
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos marcados.');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    try {
      const v = this.form.getRawValue();
      const lugar: Lugar = {
        nombre: v.nombre.trim(),
        tipo: v.tipo,
        descripcion: v.descripcion.trim(),
        horario: v.horario.trim(),
        lat: Number(v.lat),
        lng: Number(v.lng),
        activo: v.activo,
        ...(v.imagen.trim() ? { imagen: v.imagen.trim() } : {}),
      };
      await this.admin.guardar(COL.lugares, this.esNuevo() ? null : this.id(), lugar);
      const aviso = await this.toast.create({ message: 'Lugar guardado', duration: 2000, color: 'success' });
      await aviso.present();
      await this.router.navigateByUrl('/admin/lugares');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
