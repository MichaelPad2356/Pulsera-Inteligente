# Pulsera Inteligente

App móvil vinculada a una pulsera NFC que sirve de guía interactiva de una feria (tipo Feria Nacional de San Marcos):
Cultura, Gastronomía, Conciertos, Mapa y Promociones. El visitante pasa su pulsera en el lector de los establecimientos,
acumula visitas y desbloquea promociones.

- Requerimientos: [docs/Requerimientos.pdf](docs/Requerimientos.pdf)
- Avance por requerimiento: [docs/requerimientos.md](docs/requerimientos.md)

## Cómo funciona

| Quién | Qué usa | Qué hace |
|---|---|---|
| **Visitante** | App en Android (APK) o iPhone (PWA) | Consulta la feria, ve el mapa, vincula su pulsera, sigue su progreso y sus promociones |
| **Establecimiento** | Celular Android con NFC, app en *modo establecimiento* | Lee las pulseras: registra visitas y canjea promociones |
| **Administrador** | Panel en `/admin` desde la computadora | Da de alta lugares, actividades, conciertos, promociones, pulseras y roles; ve estadísticas |

Cada pulsera lleva un chip NTAG213 con un enlace grabado. Al acercarla a un teléfono se abre la app y se vincula a la
cuenta; si no, se escribe el código impreso en la pulsera.

## Estructura del repositorio

```
pulsera-inteligente/
├── docs/                 Requerimientos (PDF) y lista de control de avance
├── app-movil/            La app (Ionic + Angular + Capacitor): visitante, lector y panel
│   ├── src/app/          Código de la app (ver abajo)
│   ├── scripts/seed.mts  Carga datos de ejemplo en Firestore
│   └── android/          Proyecto nativo Android (lo genera Capacitor)
├── pruebas-reglas/       Pruebas de las reglas de seguridad en el emulador de Firestore
├── firestore.rules       Reglas de seguridad de Firestore
└── firebase.json         Configuración de Firebase (reglas, hosting de la PWA, emulador)
```

## Estructura de la app (`app-movil/src/app/`)

```
src/app/
├── core/                       Lo que usa toda la app; no tiene pantallas
│   ├── firebase.ts             Conexión a Firebase: inject(FIRESTORE), inject(AUTH)
│   ├── en-vivo.ts              Datos de Firestore en tiempo real como signals
│   ├── models/                 Tipos de cada colección de Firestore (un archivo por entidad)
│   ├── services/               Un servicio por tema: auth, catálogo, pulseras, lector, NFC, ubicación…
│   ├── guards/                 Quién puede entrar a cada ruta (sesión, rol)
│   ├── logica/                 Reglas de las promociones (con pruebas)
│   └── utils/                  Fechas, distancias, códigos de pulsera (con pruebas)
├── shared/                     Componentes y pipes reutilizables (botón «Ver ubicación», progreso…)
├── tabs/                       Barra inferior con las 5 secciones
└── features/                   Una carpeta por sección, con sus pantallas y sus rutas
    ├── auth/                   Iniciar sesión y registro                    (RF-01)
    ├── cultura/                Pabellones y actividades + detalle           (RF-02)
    ├── gastronomia/            Restaurantes, bares, Hecho en Ags            (RF-03)
    ├── conciertos/             Eventos por foro, filtros + detalle          (RF-04)
    ├── mapa/                   Mapa, tu ubicación, lugares cercanos         (RF-05, RF-06, RF-11)
    ├── promociones/            Disponibles / desbloqueadas / utilizadas     (RF-08, RF-10)
    ├── lugares/                Detalle de un lugar (se abre desde cualquier sección)
    ├── perfil/                 Perfil, historial, vincular pulsera          (RF-01, RF-09)
    ├── establecimiento/        Lector: visitas, canjes y alta de pulseras   (RF-07)
    └── admin/                  Panel administrativo                         (RF-12)
```

Convenciones:

- Cada pantalla es `nombre.page.ts` (lógica) + `nombre.page.html` (vista) + `nombre.page.scss` (estilos, si tiene).
- Cada sección tiene su `*.routes.ts`; [app.routes.ts](app-movil/src/app/app.routes.ts) tiene el mapa completo de rutas.
- Las pantallas no hablan con Firestore directamente: usan los servicios de `core/services/`.
- «Ver ubicación» siempre abre `/tabs/mapa?lugar={id}`.
- Nombres de dominio en español (`lugares`, `promociones`); nombres técnicos de Angular en inglés (`core`, `shared`,
  `features`, `routes`).

## Requisitos para desarrollar

| Herramienta | Versión | Nota |
|---|---|---|
| Node.js | 24.21 (≥ 24.15) | Con nvm-windows: `nvm use 24.21.0` |
| JDK | 21 | Para el APK y el emulador. `JAVA_HOME` → `C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot` |
| Android SDK | API 36 | Viene con Android Studio |
| Firebase CLI | 14+ | `npm i -g firebase-tools` y `firebase login` (para publicar) |

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

## Puesta en marcha (una sola vez)

1. **Tu cuenta de administrador.** Regístrate en la app. En Firebase Console → Firestore → `usuarios` → tu documento,
   cambia `rol` a `admin`. Con eso aparecen en tu perfil «Panel administrativo» y «Modo establecimiento».
2. **Publicar las reglas de seguridad** (antes del 31 de octubre, cuando vencen las de prueba):
   `firebase deploy --only firestore:rules`, o copia [firestore.rules](firestore.rules) en Firebase Console →
   Firestore → Reglas → Publicar. Para probarlas antes: `cd pruebas-reglas && npm install && npm test`.
3. **Publicar la PWA** (para iPhone y para el enlace de las pulseras):
   `cd app-movil && npm run build && cd .. && firebase deploy --only hosting` → https://pulsera-inteligente-55391.web.app
4. **Lectores de los establecimientos.** Crea una cuenta por establecimiento, y en el panel → Usuarios cámbiale el rol a
   «Establecimiento» y elige su lugar. En ese celular (Android con NFC) la app abre directamente el lector.
5. **Pulseras.** En un Android con NFC, entra como admin al lector → pestaña **Alta** y acerca cada sticker: se graba el
   enlace y se registra con un código. Escribe ese código en la pulsera.

Con las reglas publicadas, `npm run seed` necesita entrar como admin:
`$env:SEED_EMAIL="tu@correo.com"; $env:SEED_PASSWORD="***"; npm run seed` (PowerShell).

## Probar sin pulseras

En el lector (modo establecimiento) se puede escribir el código de la pulsera en lugar de acercarla. Como admin, el
lector deja elegir el lugar, así que con un solo teléfono se puede simular la visita a varios establecimientos.

## Plataformas

- **Android:** APK instalado directamente (sin Play Store). Es la única que puede ser lector (NFC).
- **iPhone:** la misma app como **PWA**, publicada en Firebase Hosting. Se abre en Safari y se instala con
  Compartir → «Agregar a pantalla de inicio». Para vincular la pulsera basta con acercarla al iPhone (XS o más nuevo):
  abre el enlace grabado. Las visitas se registran igual que en Android, porque las lee el lector del establecimiento.
