import { Component, inject } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';

import { AvisosService } from '../core/services/avisos.service';

/** Barra inferior con las 5 secciones del PDF. */
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    // Activa los avisos en vivo (visita registrada, promoción desbloqueada).
    inject(AvisosService);
  }
}
