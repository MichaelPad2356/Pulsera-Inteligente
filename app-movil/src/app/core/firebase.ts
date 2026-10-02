import { InjectionToken, inject } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

import { environment } from '../../environments/environment';

// Se inicializan bajo demanda vía inyección de dependencias:
//   private db = inject(FIRESTORE);

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => initializeApp(environment.firebase),
});

// initializeAuth en vez de getAuth: en el WebView de Capacitor getAuth puede
// quedarse colgado al cargar el resolver de popups/redirects, que no usamos
// (solo correo/contraseña).
export const AUTH = new InjectionToken<Auth>('AUTH', {
  providedIn: 'root',
  factory: () =>
    initializeAuth(inject(FIREBASE_APP), { persistence: indexedDBLocalPersistence }),
});

// Caché local persistente: la app abre rápido y sigue mostrando contenido
// si la señal en la feria es mala. Las transacciones siempre van al servidor.
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE', {
  providedIn: 'root',
  factory: () =>
    initializeFirestore(inject(FIREBASE_APP), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    }),
});
