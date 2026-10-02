import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons } from '@ionic/angular';

import { BotonPerfilComponent } from '../../shared/components/boton-perfil/boton-perfil.component';

@Component({
  selector: 'app-mapa',
  templateUrl: 'mapa.page.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, BotonPerfilComponent],
})
export class MapaPage {}
