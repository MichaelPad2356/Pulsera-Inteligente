# Pulsera Inteligente — contexto del proyecto

## Qué es
Proyecto **universitario**. El equipo es de estudiantes de **Mercadotecnia** (no programan); el desarrollo lo hace Michael.
App móvil vinculada a una pulsera NFC que funciona como guía interactiva de un evento tipo Feria Nacional de San Marcos
(Aguascalientes): Cultura, Gastronomía, Conciertos, Mapa y Promociones. El usuario pasa su pulsera en los establecimientos,
acumula visitas y desbloquea promociones.

- Requerimientos completos: `docs/Requerimientos.pdf` (RF-01 a RF-12, datos mínimos, flujo general, opciones NFC).
- **Lista de control: `docs/requerimientos.md`** — cada viñeta del PDF → cómo se cumple, archivo, semana y estado.
  **Ningún requerimiento puede faltar**: actualizar el estado ahí al terminar cada parte.
- **Entrega: noviembre 2026** (día exacto pendiente).
- El profesor pide una **app que funcione**, no un prototipo.
- Plataformas: **Android con APK** (sin tiendas) e **iPhone como PWA** del mismo código (decidido 2026-10-02: TestFlight
  se descartó porque cuesta $99 USD/año y requiere Mac). Toda función nativa necesita alternativa web o se oculta en la PWA.

## Decisiones tomadas
- **NFC: opción B del PDF.** La pulsera se lee en el lector del establecimiento: un celular Android con NFC corriendo la
  app en *modo establecimiento*. La app del visitante solo usa NFC para **vincular** su pulsera (alternativa: escribir el código).
- **Pulseras:** stickers **NTAG213 13.56 MHz** (paquete de 50) pegados en pulseras de silicón/tela sin metal. Se usa el **UID** del chip.
- **Stack:**
  - `app-movil/` → Ionic + Angular + Capacitor (Android). Un solo proyecto con dos modos: visitante y establecimiento (lector).
  - `panel-admin/` → Angular (web), desplegado en Firebase Hosting.
  - Backend → **Firebase**: Auth (correo/contraseña) + Firestore. Sin servidor propio
    (se descartó NestJS + Railway + PostgreSQL por tiempo: una sola persona, ~6 semanas).
  - Plan **Spark** (gratis) → **sin Cloud Functions**: registrar visita y recalcular progreso se hace en la app lectora
    con transacciones de Firestore; las reglas de seguridad limitan quién puede escribir interacciones.
  - **Tiempo real** con listeners de Firestore en lugar de notificaciones push (cubre RF-10).
  - Mapa → **Leaflet + OpenStreetMap** (sin API key).
- Código **fuera de OneDrive** (node_modules/Gradle dan problemas con la sincronización).

## Firebase
- Proyecto: "Pulsera Inteligente" · id `pulsera-inteligente-55391` · plan Spark.
- Authentication: correo/contraseña **habilitado**.
- Firestore: base `(default)`, ubicación nam5, **modo de prueba**.
  ⚠️ Las reglas de prueba **vencen el 2026-10-31** → reemplazarlas por reglas reales antes de esa fecha.
- App web `app-movil`: registrada (`appId 1:735368728889:web:e6f19de453d18319b018e8`). El panel puede usar la misma config.
- Firebase CLI: **no instalado** aún (`npm i -g firebase-tools` + `firebase login`, lo corre Michael).

## Alcance para la entrega
**Debe funcionar:** los 12 RF en versión básica y, sobre todo, el flujo completo de la sección 5 del PDF:
Conciertos → Viernes → Artista → Ver ubicación → Mapa centrado en el foro → pasar pulsera en el lector →
progreso "3 de 5" en vivo → promoción desbloqueada → canje → reflejado en el panel.

**Simplificado:** reglas de promoción `cantidad` (N visitas) y `lugares` (visitar una lista); sin modo offline robusto;
sin anti-clonación (NTAG 424); solo Android; estadísticas básicas.

**Regla de interacción válida:** 1 visita por lugar, por usuario, por día.

**Canje (hueco del PDF):** el establecimiento pasa la pulsera en "modo canje" y la promoción queda como utilizada.

## Modelo de datos en Firestore
Tipos en `app-movil/src/app/core/models/` (fuente de verdad, un archivo por entidad). Fechas de calendario como texto `'YYYY-MM-DD'` y horas
`'HH:mm'` (ordenan bien y son fáciles de capturar); momentos exactos (visitas, canjes) como `Timestamp`.
- `usuarios/{uid}`: nombre, email, rol (`visitante` | `establecimiento` | `admin`), lugarId (si es establecimiento)
- `pulseras/{uidChip}`: codigo, usuarioId, estado (`activa` | `bloqueada`), vinculadaEn. Id = UID del chip en hex
  mayúsculas sin separadores.
- `lugares/{id}`: nombre, tipo (`restaurante` | `bar` | `hecho_en_ags` | `pabellon` | `foro` | `otro`), descripcion, horario,
  lat, lng, imagen, activo. Una sola colección para todo lo que tiene ubicación (mapa y RF-11).
- `actividades/{id}`: nombre, descripcion, fecha, hora, lugarId (pabellón)
- `eventos/{id}`: artista, descripcion, fecha, hora, lugarId (foro)
- `promociones/{id}`: titulo, lugarId (quien la otorga), condiciones, regla {tipo, meta, lugaresIds[]}, vigenciaInicio,
  vigenciaFin, activa. Reglas = los 3 ejemplos del PDF (RF-08): `cantidad` = N lugares **distintos**; `lugares` = todos
  los de la lista; `eventos` = N eventos distintos (visita en el foro el día del evento).
- `interacciones/{id}`: usuarioId, pulseraId, lugarId, tipo (`visita` | `canje`), eventoId (visita a foro en día de evento),
  promocionId (canje), fechaHora, dia, valida.
  Visitas con id `{usuarioId}_{lugarId}_{dia}` → la regla "1 por lugar/usuario/día" se valida en la transacción
  viendo si el doc ya existe.
- `usuarios/{uid}/progreso/{promocionId}`: avance, meta, estado (`en_progreso` | `desbloqueada` | `utilizada`),
  contados[] (ids de lugares o eventos que ya sumaron), desbloqueadaEn, utilizadaEn

## Estructura y comandos
- `app-movil/`: Angular 22 (standalone, zoneless) + Ionic 9 + Capacitor 8 + Firebase JS SDK 12. App id `mx.pulsera.inteligente`.
  - Firebase se inyecta con tokens: `inject(FIRESTORE)`, `inject(AUTH)` (`src/app/core/firebase.ts`).
    Config pública en `src/environments/firebase.config.ts`. Sin Analytics (no sirve en el WebView de Android).
  - **Estructura** (detalle en `README.md`): `core/` (firebase, models; después services, guards, utils) ·
    `shared/components/` · `tabs/` · `features/<sección>/` con sus páginas y su `*.routes.ts`.
    Todas las pantallas del PDF ya existen como esqueleto (texto "Pendiente (semana N)").
  - Rutas: `/auth/login|registro` · `/tabs/{cultura|gastronomia|conciertos|mapa|promociones}` (+ `/actividad/:id`,
    `/evento/:id`, `/promocion/:id`, `/lugar/:id` dentro de cada pestaña) · `/perfil` (+ `historial`, `vincular-pulsera`) ·
    `/establecimiento`. **Ver en el mapa = `/tabs/mapa?lugar={id}`** (RF-11).
  - Las pantallas no llaman a Firestore directo: usan servicios en `core/services/` (uno por colección).
  - `npm run seed`: datos de ejemplo (`scripts/seed.mts`, ids fijos, sobrescribe). Conciertos/actividades caen el
    próximo vie/sáb/dom → volver a correrlo cuando las fechas queden en el pasado.
  - **PWA (iPhone):** `@angular/service-worker` + `src/manifest.webmanifest` + `src/assets/icons/`. El service worker solo se
    activa fuera de Capacitor (`main.ts`). En iPhone **no hay NFC** (Safari no tiene Web NFC) → la pulsera se vincula
    escribiendo su código; el lector siempre es Android. Necesita **HTTPS** → se publica en Firebase Hosting (gratis);
    el GPS en iPhone no funciona por `http://IP-local`, probar con un canal de vista previa de Hosting.
    Se instala desde Safari: Compartir → "Agregar a pantalla de inicio".
  - APK: `npm run build && npx cap sync android && cd android && gradlew assembleDebug`
    (con `JAVA_HOME` = `C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot`: Capacitor 8 exige JDK 21).

## Reparto
- Michael: app, lector, panel, Firebase.
- Equipo de mercadotecnia: nombre/logo/colores, contenido (lugares, conciertos, fotos), promociones y reglas,
  diseño de la pulsera, modelo de negocio, métricas, presentación.

## Calendario (suponiendo entrega a mediados de noviembre)
| Semana | Desarrollo |
|---|---|
| 1 (1–7 oct) | Firebase + proyecto Ionic, modelo de datos |
| 2 (8–14 oct) | Login, Cultura, Gastronomía, Conciertos |
| 3 (15–21 oct) | Mapa, ubicación, "Ver ubicación" |
| 4 (22–28 oct) | NFC: vincular pulsera, modo lector, historial |
| 5 (29 oct–4 nov) | Promociones, progreso, canje, panel + estadísticas |
| 6 (5–11 nov) | Pruebas, pulido, APK, ensayo de la demo |

## Pendientes
- [x] `firebaseConfig` de la app web
- [ ] Fecha exacta de entrega
- [x] Crear `app-movil` (Ionic tabs + Capacitor Android)
- [ ] Crear `panel-admin` (Angular)
- [x] Script de datos de ejemplo (seed) en Firestore — cargado el 2026-10-01
- [ ] Reglas de seguridad de Firestore **antes del 31-oct**
- [ ] Instalar Firebase CLI
- [x] `git init` (repo local en esta carpeta)
- [ ] Primer commit + repositorio en GitHub
- [ ] Publicar la PWA en Firebase Hosting (requiere Firebase CLI)
- [ ] Íconos de la app (PWA y Android) con el logo del equipo; hoy son los de Angular/Capacitor
- [ ] Cambiar Node global a 24.21 (`nvm use 24.21.0`) y reinstalar globales
- [ ] Al llegar los stickers: probarlos con la app "NFC Tools" (debe mostrar el UID)

## Entorno de desarrollo
Windows 11 · nvm-windows · npm 11.9 · Ionic CLI 7.2.1 · Android SDK en `%LOCALAPPDATA%\Android\Sdk` · Git 2.46.
- **Node:** Angular 22 exige ≥ 24.15. Instalado 24.21.0 con nvm (aún no es el global; el global sigue en 24.14).
- **JDK:** Capacitor 8 exige **21** → Adoptium `jdk-21.0.4.7-hotspot`. El `java` del PATH es 1.8 y el JBR de Android Studio es 17: no sirven.
- ⚠️ `C:\Users\gio_p` (la carpeta de usuario) es un repo git de otro proyecto. Este proyecto tiene su propio `.git`;
  correr git siempre desde aquí dentro.
