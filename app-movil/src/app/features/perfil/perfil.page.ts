import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRouterLink,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';
import { HistorialService } from '../../core/services/historial.service';
import { PulserasService } from '../../core/services/pulseras.service';
import { MomentoPipe } from '../../shared/pipes/fechas.pipe';

const NOMBRES_ROL = {
  visitante: 'Visitante',
  establecimiento: 'Establecimiento',
  admin: 'Administrador',
} as const;

/** Mi perfil (RF-01): datos, pulsera vinculada y cuántos lugares/eventos ha visitado (RF-08). */
@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  imports: [
    RouterLink,
    IonRouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    MomentoPipe,
  ],
})
export class PerfilPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly historial = inject(HistorialService);

  readonly perfil = this.auth.perfil;
  readonly esPersonal = this.auth.esPersonal;
  readonly esAdmin = computed(() => this.auth.rol() === 'admin');
  readonly pulsera = inject(PulserasService).miPulsera;
  readonly rol = computed(() => {
    const rol = this.auth.rol();
    return rol ? NOMBRES_ROL[rol] : '';
  });

  async cerrarSesion(): Promise<void> {
    await this.auth.cerrarSesion();
    await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
