// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
import { firebaseConfig } from './firebase.config';

export const environment = {
  production: false,
  firebase: firebaseConfig,
  /** Dónde se publica la PWA (Firebase Hosting). Es el enlace que se graba en cada pulsera. */
  urlPublica: 'https://pulsera-inteligente-55391.web.app',
};
