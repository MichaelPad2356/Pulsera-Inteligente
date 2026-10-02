import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonRouterLinkWithHref,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService, mensajeErrorAuth } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['../auth.scss'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonRouterLinkWithHref,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonText,
  ],
})
export class RegistroPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly volver = input<string>();

  readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmar: ['', Validators.required],
  });
  readonly enviando = signal(false);
  readonly error = signal('');

  async registrar(): Promise<void> {
    const { nombre, email, password, confirmar } = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        password && password.length < 6
          ? 'La contraseña debe tener al menos 6 caracteres.'
          : 'Llena todos los campos con datos válidos.',
      );
      return;
    }
    if (password !== confirmar) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    try {
      await this.auth.registrar(nombre.trim(), email.trim(), password);
      // Lo primero después de registrarse: vincular su pulsera (conservando el código
      // si llegó desde el enlace grabado en la pulsera).
      const volver = this.volver();
      const destino = volver?.startsWith('/perfil/vincular-pulsera') ? volver : '/perfil/vincular-pulsera';
      await this.router.navigateByUrl(destino, { replaceUrl: true });
      this.form.reset();
    } catch (e) {
      this.error.set(mensajeErrorAuth(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
