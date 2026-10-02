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
  IonLabel,
  IonSegment,
  IonSegmentButton,
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
import { COL, Promocion, ReglaPromocion } from '../../../core/models';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { diaEnAgs } from '../../../core/utils/fechas';
import { AdminService } from '../admin.service';

type TipoRegla = ReglaPromocion['tipo'];

/** RF-08 y RF-12: crear o editar una promoción y su regla configurable. */
@Component({
  selector: 'app-admin-promocion-form',
  templateUrl: 'promocion-form.page.html',
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
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonToggle,
    IonButton,
    IonIcon,
    IonText,
  ],
})
export class PromocionFormPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  /** 'nueva' o el id de la promoción (de la ruta). */
  readonly id = input.required<string>();
  readonly esNueva = computed(() => this.id() === 'nueva');
  readonly lugares = this.catalogo.lugaresTodos;

  readonly form = inject(FormBuilder).nonNullable.group({
    titulo: ['', Validators.required],
    lugarId: ['', Validators.required],
    condiciones: [''],
    tipoRegla: ['cantidad' as TipoRegla],
    meta: [5, [Validators.required, Validators.min(1)]],
    lugaresIds: [[] as string[]],
    vigenciaInicio: [diaEnAgs(), Validators.required],
    vigenciaFin: [diaEnAgs(), Validators.required],
    activa: [true],
  });
  /** Para mostrar solo los campos de la regla elegida. */
  readonly tipoRegla = signal<TipoRegla>('cantidad');
  readonly guardando = signal(false);
  readonly error = signal('');
  private cargado = false;

  constructor() {
    effect(() => {
      const promo = this.esNueva() ? undefined : this.catalogo.promocion(this.id());
      if (promo && !this.cargado) {
        this.cargado = true;
        untracked(() => {
          this.form.reset({
            titulo: promo.titulo,
            lugarId: promo.lugarId,
            condiciones: promo.condiciones,
            tipoRegla: promo.regla.tipo,
            meta: promo.regla.meta,
            lugaresIds: promo.regla.tipo === 'lugares' ? promo.regla.lugaresIds : [],
            vigenciaInicio: promo.vigenciaInicio,
            vigenciaFin: promo.vigenciaFin,
            activa: promo.activa,
          });
          this.tipoRegla.set(promo.regla.tipo);
        });
      }
    });
  }

  elegirRegla(tipo: TipoRegla): void {
    this.tipoRegla.set(tipo);
    this.form.patchValue({ tipoRegla: tipo });
  }

  async guardar(): Promise<void> {
    const v = this.form.getRawValue();
    const regla = this.armarRegla(v.tipoRegla, Number(v.meta), v.lugaresIds);
    if (this.form.invalid || !regla) {
      this.form.markAllAsTouched();
      this.error.set(
        !regla
          ? 'Para la regla de lugares específicos elige al menos un lugar.'
          : 'Llena título, lugar, meta y vigencia.',
      );
      return;
    }
    if (v.vigenciaFin < v.vigenciaInicio) {
      this.error.set('La vigencia termina antes de empezar.');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    try {
      const promocion: Promocion = {
        titulo: v.titulo.trim(),
        lugarId: v.lugarId,
        condiciones: v.condiciones.trim(),
        regla,
        vigenciaInicio: v.vigenciaInicio,
        vigenciaFin: v.vigenciaFin,
        activa: v.activa,
      };
      await this.admin.guardar(COL.promociones, this.esNueva() ? null : this.id(), promocion);
      const aviso = await this.toast.create({ message: 'Promoción guardada', duration: 2000, color: 'success' });
      await aviso.present();
      await this.router.navigateByUrl('/admin/promociones');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  private armarRegla(tipo: TipoRegla, meta: number, lugaresIds: string[]): ReglaPromocion | null {
    switch (tipo) {
      case 'cantidad':
        return { tipo, meta };
      case 'eventos':
        return { tipo, meta };
      case 'lugares':
        return lugaresIds.length ? { tipo, meta: lugaresIds.length, lugaresIds } : null;
    }
  }
}
