# Pulsera Inteligente

App móvil vinculada a una pulsera NFC que sirve de guía interactiva de una feria (tipo Feria Nacional de San Marcos):
Cultura, Gastronomía, Conciertos, Mapa y Promociones. El visitante pasa su pulsera en los establecimientos, acumula
visitas y desbloquea promociones.

- Requerimientos: [docs/Requerimientos.pdf](docs/Requerimientos.pdf)
- Avance por requerimiento: [docs/requerimientos.md](docs/requerimientos.md)

## Estructura del repositorio

```
pulsera-inteligente/
├── docs/                 Requerimientos (PDF) y lista de control de avance
├── app-movil/            App del visitante y del establecimiento (Ionic + Angular + Capacitor)
│   ├── src/app/          Código de la app (ver abajo)
│   ├── scripts/seed.mts  Carga datos de ejemplo en Firestore
│   └── android/          Proyecto nativo Android (lo genera Capacitor)
└── panel-admin/          Panel web para administrar contenido (pendiente)
```

## Estructura de la app (`app-movil/src/app/`)

```
src/app/
├── core/                       Lo que usa toda la app; no tiene pantallas
│   ├── firebase.ts             Conexión a Firebase: inject(FIRESTORE), inject(AUTH)
│   └── models/                 Tipos de cada colección de Firestore (un archivo por entidad)
├── shared/                     Componentes visuales reutilizables
│   └── components/
├── tabs/                       Barra inferior con las 5 secciones
└── features/                   Una carpeta por sección; cada una con sus pantallas y sus rutas
    ├── auth/                   Iniciar sesión y registro                    (RF-01)
    ├── cultura/                Pabellones y actividades + detalle           (RF-02)
    ├── gastronomia/            Restaurantes, bares, Hecho en Ags            (RF-03)
    ├── conciertos/             Eventos por foro, filtros + detalle          (RF-04)
    ├── mapa/                   Mapa, tu ubicación, lugares cercanos         (RF-05, RF-06, RF-11)
    ├── promociones/            Disponibles / desbloqueadas / utilizadas     (RF-08, RF-10)
    ├── lugares/                Detalle de un lugar (se abre desde cualquier sección)
    ├── perfil/                 Perfil, historial, vincular pulsera          (RF-01, RF-09)
    └── establecimiento/        Modo lector: registrar visitas y canjes      (RF-07)
```

Convenciones:

- Cada pantalla es una carpeta con `nombre.page.ts` (lógica) y `nombre.page.html` (vista).
- Cada sección tiene su archivo `*.routes.ts`; [app.routes.ts](app-movil/src/app/app.routes.ts) tiene el mapa completo de rutas.
- Lo que lee o escribe en Firestore irá en `core/services/` (un servicio por colección); las pantallas no hablan
  con Firestore directamente.
- Nombres de dominio en español (`lugares`, `promociones`); nombres técnicos de Angular en inglés (`core`, `shared`,
  `features`, `routes`).

## Requisitos para desarrollar

| Herramienta | Versión | Nota |
|---|---|---|
| Node.js | 24.21 (≥ 24.15) | Con nvm-windows: `nvm use 24.21.0` |
| JDK | 21 | Capacitor 8 lo exige. `JAVA_HOME` → `C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot` |
| Android SDK | API 36 | Viene con Android Studio |

## Comandos (desde `app-movil/`)

| Qué | Comando |
|---|---|
| Instalar dependencias | `npm install` |
| Ver la app en el navegador | `npm start` → http://localhost:4200 |
| Cargar datos de ejemplo | `npm run seed` |
| Pruebas y lint | `npm test -- --watch=false` · `npm run lint` |
| APK de Android | `npm run build && npx cap sync android && cd android && gradlew assembleDebug` |
| Abrir en Android Studio | `npx cap open android` |

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Plataformas

- **Android:** APK instalado directamente (sin Play Store). Es la versión completa, incluido el NFC.
- **iPhone:** la misma app como **PWA**, publicada en Firebase Hosting. Se abre en Safari y se instala con
  Compartir → «Agregar a pantalla de inicio». Diferencia: el iPhone no puede leer NFC desde el navegador, así que la
  pulsera se vincula escribiendo el código impreso. Las visitas se registran igual, porque las lee el celular Android
  del establecimiento.
