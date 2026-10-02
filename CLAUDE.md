# Pulsera Inteligente — contexto del proyecto

Responder siempre en **español**.

## Qué es
Proyecto **universitario**. El equipo es de estudiantes de **Mercadotecnia** (no programan); el desarrollo lo hace Michael.
App móvil vinculada a una pulsera NFC que funciona como guía interactiva de un evento tipo Feria Nacional de San Marcos
(Aguascalientes): Cultura, Gastronomía, Conciertos, Mapa y Promociones. El usuario pasa su pulsera en los establecimientos,
acumula visitas y desbloquea promociones.

- Requerimientos completos: `docs/Requerimientos.pdf` (RF-01 a RF-12, datos mínimos, flujo general, opciones NFC).
- **Lista de control: `docs/requerimientos.md`** — cada viñeta del PDF → cómo se cumple, archivo y estado.
  **Ningún requerimiento puede faltar**: actualizar el estado ahí al cambiar algo.
- **Entrega: noviembre 2026** (día exacto pendiente). El profesor pide una **app que funcione**, no un prototipo.
- Plataformas: **Android con APK** (sin tiendas) e **iPhone como PWA** del mismo código (decidido 2026-10-02: TestFlight
  se descartó porque cuesta $99 USD/año y requiere Mac). Toda función nativa necesita alternativa web.

## Decisiones tomadas
- **NFC: opción B del PDF.** Las visitas se registran al acercar la pulsera al **lector del establecimiento**: un celular
  Android con NFC y la app en *modo establecimiento*. Funciona igual para visitantes con iPhone o Android.
- **Vincular la pulsera (RF-01), igual en iPhone y Android:** cada sticker lleva grabado el enlace
  `https://pulsera-inteligente-55391.web.app/p/{codigo}`. Al acercarlo a un teléfono (iPhone XS+ lo lee de forma nativa)
  se abre la app y la vincula. En la app Android también se puede leer con NFC. Respaldo: escribir el código impreso.
- **Pulseras:** stickers **NTAG213** pegados en pulseras de silicón/tela sin metal. Id = **UID** del chip; código de
  6 caracteres sin letras confusas. Alta: lector en modo **Alta** (admin) graba el enlace y registra la pulsera.
- **Panel administrativo (RF-12) dentro de la misma app** (`/admin`, solo rol admin), no proyecto aparte: reutiliza modelos
  y servicios, un solo código y un solo despliegue. Se usa desde la computadora (menú lateral).
- **Backend:** Firebase Auth (correo/contraseña) + Firestore, plan **Spark** (gratis, sin Cloud Functions). Registrar
  visita, avanzar progreso y canjear son **transacciones de Firestore** desde el lector; las reglas limitan quién escribe.
- **Tiempo real** con listeners de Firestore (signals) en lugar de notificaciones push (RF-10).
- Mapa → **Leaflet + OpenStreetMap** (sin API key). Si OSM bloquea los tiles, cambiar a CARTO (ver `mapa.page.ts`).
- Código **fuera de OneDrive**.

## Firebase
- Proyecto: "Pulsera Inteligente" · id `pulsera-inteligente-55391` · plan Spark. Auth correo/contraseña habilitado.
- Firestore `(default)`, nam5, **modo de prueba** (vence 2026-10-31). Las reglas reales están en `firestore.rules`
  (probadas: `pruebas-reglas/`, 46 casos) — **falta publicarlas**. Antes de publicarlas, poner `rol: "admin"` a la cuenta
  de Michael en la consola (usuarios/{uid}); después el seed necesita `SEED_EMAIL`/`SEED_PASSWORD` de un admin.
- `firebase.json` + `.firebaserc` en la raíz: reglas, Hosting (`app-movil/www`, SPA) y emulador.
- Firebase CLI **no instalado** globalmente (`npm i -g firebase-tools` + `firebase login`, lo corre Michael).

## Reglas de negocio
- **1 visita por lugar, por usuario, por día** (id de la visita `{usuarioId}_{lugarId}_{dia}`; si existe, no cuenta).
- Reglas de promoción = los 3 ejemplos del PDF: `cantidad` (N lugares distintos), `lugares` (todos los de una lista),
  `eventos` (N eventos: visita al foro el día de un evento → `eventoId`). Lógica pura y probada en
  `core/logica/promociones.ts`.
- **Canje:** el lector en modo Canje lee la pulsera, muestra las promociones desbloqueadas que otorga ese lugar y las marca
  como utilizadas (+ interacción tipo `canje`).

## Modelo de datos en Firestore
Tipos en `app-movil/src/app/core/models/` (fuente de verdad, un archivo por entidad). Fechas `'YYYY-MM-DD'`, horas
`'HH:mm'`; momentos exactos como `Timestamp`.
- `usuarios/{uid}`: nombre, email, rol (`visitante` | `establecimiento` | `admin`), lugarId (establecimiento)
- `pulseras/{uidChip}`: codigo, usuarioId, estado (`activa` | `bloqueada`), vinculadaEn
- `lugares/{id}`: nombre, tipo (`restaurante` | `bar` | `hecho_en_ags` | `pabellon` | `foro` | `otro`), descripcion,
  horario, lat, lng, imagen?, activo. Todo lo que tiene ubicación (establecimientos, pabellones, foros).
- `actividades/{id}`: nombre, descripcion, fecha, hora, lugarId · `eventos/{id}`: artista, descripcion, fecha, hora, lugarId, imagen?
- `promociones/{id}`: titulo, lugarId (la otorga), condiciones, regla {tipo, meta, lugaresIds?}, vigenciaInicio, vigenciaFin, activa
- `interacciones/{id}`: usuarioId, pulseraId, lugarId, tipo (`visita` | `canje`), eventoId?, promocionId?, fechaHora, dia.
  Solo se guardan las válidas.
- `usuarios/{uid}/progreso/{promocionId}`: avance, meta, estado (`en_progreso` | `desbloqueada` | `utilizada`), contados[],
  desbloqueadaEn, utilizadaEn

## Estructura (detalle en `README.md`)
- `app-movil/src/app/`: `core/` (firebase, en-vivo, errores, iconos, models, services, guards, logica, utils) ·
  `shared/` (components, pipes) · `tabs/` · `features/<sección>/` (auth, cultura, gastronomia, conciertos, mapa,
  promociones, lugares, perfil, establecimiento, admin), cada una con sus páginas y su `*.routes.ts`.
- Las pantallas no llaman a Firestore directo: usan `core/services/` (o `features/admin/admin.service.ts`).
- Datos en vivo: `consultaEnVivo()` / `documentoEnVivo()` (`core/en-vivo.ts`) → signals que se re-suscriben al cambiar
  de usuario. Íconos: registrar los nuevos en `core/iconos.ts`.
- Rutas: `/auth/*` · `/tabs/{cultura|gastronomia|conciertos|mapa|promociones}` (+ detalles `actividad|evento|promocion|lugar/:id`)
  · `/perfil` (+ `historial`, `vincular-pulsera`) · `/establecimiento` · `/admin/*` · `/p/:codigo`.
  **Ver en el mapa = `/tabs/mapa?lugar={id}`** (RF-11). Guards en `core/guards/auth.guards.ts`.
- Leaflet en páginas de Ionic: crear el mapa en `ionViewDidEnter` (antes la página no está en el DOM y queda de 0 px).

## Comandos (en `app-movil/`, con Node 24.21)
- `npm start` (navegador) · `npm test -- --watch=false` · `npm run lint` · `npm run build`
- `npm run seed`: datos de ejemplo (ids fijos, sobrescribe; fechas = próximo vie/sáb/dom → re-correr si ya pasaron).
- APK: `npm run build && npx cap sync android && cd android && gradlew assembleDebug` (`JAVA_HOME` = JDK 21).
- Reglas: `cd pruebas-reglas && npm install && npm test` (JDK 21).
- Publicar (cuando haya CLI): `firebase deploy --only firestore:rules` y `npm run build` + `firebase deploy --only hosting`.

## Verificado (2026-10-02)
- Prueba de punta a punta en Chrome (headless) contra Firebase real: 20 pasos OK (registro, vincular, 5 visitas con
  aviso en vivo, regla diaria, desbloqueos, canje, historial, flujo Conciertos→Mapa, cercanos, panel).
- Tiempo real: con la caché persistente de Firestore (IndexedDB, multi-pestaña) a veces el primer cambio tardaba ~26 s
  tras cargar la página. Se cambió a `memoryLocalCache` (core/firebase.ts): cambios en el mapa y progreso en ~0.1 s.
  **No volver a activar la caché persistente** sin repetir esa prueba.
- APK compila con NFC/GPS (permisos en el manifest). **NFC sin probar en hardware** (faltan los stickers).

## Reparto
- Michael: app, lector, panel, Firebase.
- Equipo de mercadotecnia: nombre/logo/colores, contenido (lugares reales con coordenadas, conciertos, fotos),
  promociones y reglas, diseño de la pulsera, modelo de negocio, métricas, presentación.

## Pendientes
- [ ] Fecha exacta de entrega
- [ ] Instalar Firebase CLI, poner rol admin a Michael y **publicar `firestore.rules` antes del 31-oct**
- [ ] Publicar la PWA en Firebase Hosting (también hace funcionar el enlace `/p/{codigo}` de las pulseras)
- [ ] Al llegar los stickers: probar lector, vincular y modo Alta en un Android con NFC; probar enlace en un iPhone
- [ ] Contenido real (el seed es de ejemplo: coordenadas aproximadas y artistas ficticios) — desde el panel
- [ ] Íconos y colores de la app con el logo del equipo (hoy son los de Angular/Ionic)
- [ ] Cambiar Node global a 24.21 (`nvm use 24.21.0`) y reinstalar globales
- [ ] Ensayo de la demo con 2 celulares (lector + visitante) y buena conexión

## Entorno de desarrollo
Windows 11 · nvm-windows · Ionic CLI 7.2.1 · Android SDK en `%LOCALAPPDATA%\Android\Sdk` · Git 2.46.
- **Node:** Angular 22 exige ≥ 24.15. Instalado 24.21.0 con nvm (aún no es el global; el global sigue en 24.14).
- **JDK:** Capacitor 8 y el emulador exigen **21** → `C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot`.
  El `java` del PATH es 1.8 y el JBR de Android Studio es 17: no sirven.
- ⚠️ `C:\Users\gio_p` (la carpeta de usuario) es un repo git de otro proyecto. Este proyecto tiene su propio `.git`;
  correr git siempre desde aquí dentro.
- Repo: https://github.com/MichaelPad2356/Pulsera-Inteligente (público, rama main).
