import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonRouterLinkWithHref,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService, inicioPorRol, mensajeErrorAuth } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['../auth.scss'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonRouterLinkWithHref,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonText,
  ],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Adónde regresar después de iniciar sesión (lo pone el guard). */
  readonly volver = input<string>();

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly enviando = signal(false);
  readonly error = signal('');

  async entrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Escribe tu correo y contraseña.');
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.iniciarSesion(email.trim(), password);
      const destino = this.volver() || inicioPorRol(await this.auth.rolActual());
      await this.router.navigateByUrl(destino, { replaceUrl: true });
      this.form.reset();
    } catch (e) {
      this.error.set(mensajeErrorAuth(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
