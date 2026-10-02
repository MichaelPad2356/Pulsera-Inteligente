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
import { COL, Evento } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { diaEnAgs } from '../../../core/utils/fechas';
import { AdminService } from '../admin.service';

/** RF-12: crear o editar un concierto (artista, fecha, hora, foro, descripción). */
@Component({
  selector: 'app-admin-evento-form',
  templateUrl: 'evento-form.page.html',
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
export class EventoFormPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  /** 'nuevo' o el id del evento (de la ruta). */
  readonly id = input.required<string>();
  readonly esNuevo = computed(() => this.id() === 'nuevo');

  /** Primero los foros; los demás lugares salen en «Otros eventos». */
  readonly lugares = computed(() =>
    (this.catalogo.lugaresTodos() ?? [])
      .slice()
      .sort((a, b) => Number(b.tipo === 'foro') - Number(a.tipo === 'foro')),
  );

  readonly form = inject(FormBuilder).nonNullable.group({
    artista: ['', Validators.required],
    descripcion: [''],
    fecha: [diaEnAgs(), Validators.required],
    hora: ['21:00', Validators.required],
    lugarId: ['', Validators.required],
    imagen: [''],
  });
  readonly guardando = signal(false);
  readonly error = signal('');
  private cargado = false;

  constructor() {
    effect(() => {
      const evento = this.esNuevo() ? undefined : this.catalogo.evento(this.id());
      if (evento && !this.cargado) {
        this.cargado = true;
        untracked(() => this.form.reset({ imagen: '', ...evento }));
      }
    });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Llena artista, fecha, hora y foro.');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    try {
      const { imagen, ...v } = this.form.getRawValue();
      const evento: Evento = {
        ...v,
        artista: v.artista.trim(),
        descripcion: v.descripcion.trim(),
        ...(imagen.trim() ? { imagen: imagen.trim() } : {}),
      };
      await this.admin.guardar(COL.eventos, this.esNuevo() ? null : this.id(), evento);
      const aviso = await this.toast.create({ message: 'Evento guardado', duration: 2000, color: 'success' });
      await aviso.present();
      await this.router.navigateByUrl('/admin/eventos');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
