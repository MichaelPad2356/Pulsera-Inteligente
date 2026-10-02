import { firebaseConfig } from './firebase.config';

export const environment = {
  production: true,
  firebase: firebaseConfig,
  /** Dónde se publica la PWA (Firebase Hosting). Es el enlace que se graba en cada pulsera. */
  urlPublica: 'https://pulsera-inteligente-55391.web.app',
};
