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
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { mensajeDeError } from '../../../core/errores';
import { Actividad, COL } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { diaEnAgs } from '../../../core/utils/fechas';
import { AdminService } from '../admin.service';

/** RF-12: crear o editar una actividad cultural (nombre, fecha, hora, descripción y lugar). */
@Component({
  selector: 'app-admin-actividad-form',
  templateUrl: 'actividad-form.page.html',
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
    IonButton,
    IonIcon,
    IonText,
  ],
})
export class ActividadFormPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  /** 'nueva' o el id de la actividad (de la ruta). */
  readonly id = input.required<string>();
  readonly esNueva = computed(() => this.id() === 'nueva');

  /** Primero los pabellones, que es donde suelen ser las actividades. */
  readonly lugares = computed(() =>
    (this.catalogo.lugaresTodos() ?? [])
      .slice()
      .sort((a, b) => Number(b.tipo === 'pabellon') - Number(a.tipo === 'pabellon')),
  );

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    fecha: [diaEnAgs(), Validators.required],
    hora: ['12:00', Validators.required],
    lugarId: ['', Validators.required],
  });
  readonly guardando = signal(false);
  readonly error = signal('');
  private cargado = false;

  constructor() {
    effect(() => {
      const actividad = this.esNueva() ? undefined : this.catalogo.actividad(this.id());
      if (actividad && !this.cargado) {
        this.cargado = true;
        untracked(() => this.form.reset(actividad));
      }
    });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Llena nombre, fecha, hora y lugar.');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    try {
      const v = this.form.getRawValue();
      const actividad: Actividad = { ...v, nombre: v.nombre.trim(), descripcion: v.descripcion.trim() };
      await this.admin.guardar(COL.actividades, this.esNueva() ? null : this.id(), actividad);
      const aviso = await this.toast.create({ message: 'Actividad guardada', duration: 2000, color: 'success' });
      await aviso.present();
      await this.router.navigateByUrl('/admin/actividades');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
