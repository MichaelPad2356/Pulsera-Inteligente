import { InjectionToken, inject } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

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

// Caché solo en memoria. Con la caché persistente (IndexedDB) la app mostraba datos
// guardados al recargar, pero a veces tardaba ~25 s en recibir cambios en vivo (RF-10);
// para la demo importa más que el progreso llegue al instante.
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE', {
  providedIn: 'root',
  factory: () => initializeFirestore(inject(FIREBASE_APP), { localCache: memoryLocalCache() }),
});
