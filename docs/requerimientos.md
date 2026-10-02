# Requerimientos → implementación

Lista de control de **todo** lo que pide [Requerimientos.pdf](Requerimientos.pdf): cada renglón dice cómo se cumple
y en qué parte del código vive. Antes de la entrega todos los renglones deben estar en ✅.

**Estado:** ✅ hecho · 🟡 parcial · ⬜ pendiente  
**Rutas** relativas a `app-movil/src/app/` salvo que se indique otra cosa. **Sem.** = semana del calendario.

## RF-01. Registro e identificación del usuario

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Registrarse e iniciar sesión | Firebase Auth con correo y contraseña | `features/auth/login`, `features/auth/registro` | 2 | ⬜ |
| Cada usuario tiene un perfil único | Documento `usuarios/{uid}` con el uid de Auth | `features/perfil`, `core/models/usuario.model.ts` | 2 | 🟡 modelo listo |
| Cada pulsera asociada a un usuario por un identificador único | `pulseras/{UID del chip}` guarda `usuarioId`; se vincula acercándola al teléfono (Android) o escribiendo su código (Android y iPhone) | `features/perfil/vincular-pulsera` | 4 | 🟡 modelo listo |
| El sistema reconoce y registra las interacciones de la pulsera | El lector busca la pulsera por UID → obtiene el usuario → crea la interacción | `features/establecimiento/lector` | 4 | ⬜ |

## RF-02. Sección Cultura

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Mostrar los pabellones culturales | `lugares` con tipo `pabellon` | `features/cultura` | 2 | ⬜ |
| Mostrar las actividades programadas | Colección `actividades`, ordenadas por fecha y hora | `features/cultura` | 2 | ⬜ |
| Cada actividad: nombre, fecha, hora, descripción y lugar | Pantalla de detalle | `features/cultura/actividad-detalle` | 2 | ⬜ |
| Opción «Ver ubicación» en cada actividad | Botón que abre `/tabs/mapa?lugar={lugarId}` | `features/cultura/actividad-detalle` | 3 | ⬜ |
| Al pulsarla, el mapa se abre y señala el punto | El mapa se centra en el lugar y abre su marcador | `features/mapa` | 3 | ⬜ |

## RF-03. Sección Gastronomía

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Mostrar restaurantes, bares y establecimientos | `lugares` con tipo `restaurante` / `bar`, en segmentos | `features/gastronomia` | 2 | ⬜ |
| Categoría o apartado «Hecho en Aguascalientes» | Segmento propio, tipo `hecho_en_ags` | `features/gastronomia` | 2 | ⬜ |
| Cada establecimiento: nombre, categoría, descripción, ubicación, horario y promociones (cuando aplique) | Detalle del lugar; muestra las promociones que otorga o que lo incluyen en su regla | `features/lugares/lugar-detalle` | 2 | ⬜ |
| Botón para verlo en el mapa | «Ver en el mapa» → `/tabs/mapa?lugar={id}` | `features/lugares/lugar-detalle` | 3 | ⬜ |

## RF-04. Sección Conciertos

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Organizar por Foro del Lago, Foro de las Estrellas, Palenque y otros eventos | Eventos agrupados por foro; los foros no principales van en «Otros eventos» | `features/conciertos` | 2 | ⬜ |
| Filtrar por fecha, artista y foro | Chips de día (Vie, Sáb, Dom…), buscador de artista y selector de foro | `features/conciertos` | 2 | ⬜ |
| Cada evento: artista, fecha, hora, foro, descripción y ubicación | Pantalla de detalle | `features/conciertos/evento-detalle` | 2 | ⬜ |
| Opción «Ir a ubicación» | Botón que abre el mapa centrado en el foro | `features/conciertos/evento-detalle` | 3 | ⬜ |
| Navegación: Conciertos → Viernes → Artista → Ver ubicación → Mapa → Foro | Es el flujo de la demo; se prueba completo en la semana 3 | (varias) | 3 | ⬜ |

## RF-05. Mapa interactivo

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Ubicación actual del usuario por GPS | Plugin `@capacitor/geolocation` | `features/mapa` | 3 | ⬜ |
| Todos los lugares, establecimientos, actividades y eventos registrados | Un marcador por lugar; su ventana lista los eventos y actividades de ese lugar | `features/mapa` | 3 | ⬜ |
| Restaurantes, bares, pabellones, foros, promociones y otros puntos | Ícono y color por tipo, con filtro; los lugares con promoción activa llevan distintivo | `features/mapa` | 3 | ⬜ |
| Seleccionar un punto para ver su información | Ventana del marcador → detalle del lugar | `features/mapa` | 3 | ⬜ |
| Todo lo que tiene ubicación se abre directamente en el mapa | Una sola ruta para todo: `/tabs/mapa?lugar={id}` | `features/mapa/mapa.routes.ts` | 3 | 🟡 ruta lista |

## RF-06. Ubicación del usuario

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Solicitar permiso de ubicación | Permiso al abrir el mapa: nativo en Android (`AndroidManifest.xml`), del navegador en la PWA de iPhone | `features/mapa` | 3 | ⬜ |
| Marcador con la posición del usuario | Marcador «Estás aquí» que se actualiza | `features/mapa` | 3 | ⬜ |
| Ver lugares cercanos según su posición | Lista «Cerca de ti» ordenada por distancia | `features/mapa` | 3 | ⬜ |

## RF-07. Integración NFC/RFID

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Cada pulsera tiene un identificador único | UID del chip NTAG213 = id del documento en `pulseras` | `core/models/pulsera.model.ts` | 1 | ✅ |
| Los establecimientos tienen un mecanismo para leer la pulsera | Celular Android con NFC y la app en modo establecimiento (opción B del PDF) | `features/establecimiento/lector` | 4 | ⬜ |
| Al acercar la pulsera se identifica al usuario y se registra la interacción | Lee UID → `pulseras` → usuario → transacción de Firestore | `features/establecimiento/lector` | 4 | ⬜ |
| La interacción se asocia con lugar, fecha y hora | Campos `lugarId`, `fechaHora` y `dia` de la interacción | `core/models/interaccion.model.ts` | 1 | ✅ |
| Actualiza el progreso y desbloquea promociones | La misma transacción actualiza `usuarios/{uid}/progreso` | `features/establecimiento/lector` | 5 | ⬜ |

## RF-08. Sistema de promociones

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Registrar cuántos lugares, establecimientos o eventos visitó | Contador en el perfil a partir de `interacciones` | `features/perfil` | 4 | ⬜ |
| Regla configurable: número de establecimientos visitados | Regla `cantidad` (N lugares distintos) | `core/models/promocion.model.ts` | 1 / 5 | 🟡 modelo listo |
| Regla configurable: lugares específicos | Regla `lugares` (visitar todos los de una lista) | `core/models/promocion.model.ts` | 1 / 5 | 🟡 modelo listo |
| Regla configurable: participación en eventos | Regla `eventos` (visita en el foro el día del evento → `eventoId`) | `core/models/promocion.model.ts` | 1 / 5 | 🟡 modelo listo |
| Mostrar promociones disponibles, desbloqueadas y utilizadas | Tres segmentos | `features/promociones` | 5 | ⬜ |
| Cada promoción: establecimiento, condiciones, vigencia y ubicación | Detalle de la promoción + «Ver en el mapa» | `features/promociones/promocion-detalle` | 5 | ⬜ |

## RF-09. Historial de interacciones

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Guardar el historial de visitas e interacciones | Colección `interacciones` (no se borra) | `core/models/interaccion.model.ts` | 4 | 🟡 modelo listo |
| Cada registro: usuario, lugar, fecha, hora y tipo | Campos `usuarioId`, `lugarId`, `fechaHora`, `tipo` | `core/models/interaccion.model.ts` | 1 | ✅ |
| El usuario consulta su progreso o historial | Pantalla Historial; progreso en Promociones | `features/perfil/historial` | 4 | ⬜ |

## RF-10. Progreso del usuario

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Avance visual, ej. «3 de 5 establecimientos visitados» | Barra de progreso por promoción | `features/promociones` | 5 | ⬜ |
| Cuántas interacciones faltan | Texto «Te faltan 2 visitas» | `features/promociones` | 5 | ⬜ |
| Se actualiza solo después de cada interacción válida | Listener de Firestore en tiempo real (sin recargar) | `features/promociones` | 5 | ⬜ |

## RF-11. Integración entre módulos

| Requisito del PDF | Cómo se cumple | Dónde | Sem. | Estado |
|---|---|---|---|---|
| Cultura, Gastronomía, Conciertos y Promociones conectados con el Mapa | Todos navegan a la misma ruta `/tabs/mapa?lugar={id}` | (varias) | 3 | ⬜ |
| Todo elemento con ubicación tiene acceso directo al mapa | Botón en cada detalle: actividad, lugar, evento y promoción | `features/*/…-detalle` | 3 | ⬜ |
| El mapa se abre centrado en el lugar seleccionado | `?lugar=` centra el mapa y abre el marcador | `features/mapa` | 3 | ⬜ |

## RF-12. Panel administrativo

Vive en `panel-admin/` (Angular web, Firebase Hosting), aparte de la app.

| Requisito del PDF | Cómo se cumple | Sem. | Estado |
|---|---|---|---|
| Agregar, editar y eliminar establecimientos | CRUD de `lugares` | 5 | ⬜ |
| Agregar y modificar actividades culturales y conciertos | CRUD de `actividades` y `eventos` | 5 | ⬜ |
| Crear, editar y desactivar promociones | CRUD de `promociones` + interruptor `activa` | 5 | ⬜ |
| Registrar o modificar coordenadas y ubicaciones | Clic en un mapa (Leaflet) para fijar lat/lng | 5 | ⬜ |
| Consultar interacciones y estadísticas básicas | Tabla de interacciones + totales: visitas por lugar, promociones desbloqueadas y canjeadas, usuarios | 5 | ⬜ |

## 4. Datos mínimos que debe almacenar el sistema

Todos están definidos en `core/models/` (un archivo por entidad).

| Dato del PDF | Dónde se guarda | Estado |
|---|---|---|
| Usuarios | `usuarios/{uid}` | ✅ |
| Pulseras | `pulseras/{uidChip}` | ✅ |
| Establecimientos | `lugares` tipo `restaurante`, `bar`, `hecho_en_ags` | ✅ |
| Pabellones culturales | `lugares` tipo `pabellon` | ✅ |
| Actividades culturales | `actividades` | ✅ |
| Eventos y conciertos | `eventos` | ✅ |
| Foros | `lugares` tipo `foro` | ✅ |
| Ubicaciones y coordenadas | `lat` y `lng` en `lugares` (actividades, eventos y promociones apuntan a un lugar) | ✅ |
| Promociones | `promociones` | ✅ |
| Interacciones y visitas | `interacciones` | ✅ |
| Progreso del usuario | `usuarios/{uid}/progreso/{promocionId}` | ✅ |

## 5. Flujo general (es la demo)

| Paso del PDF | Pantalla | Sem. | Estado |
|---|---|---|---|
| 1. El usuario abre la aplicación | Login o, si ya inició sesión, Conciertos | 2 | ⬜ |
| 2. Consulta Cultura, Gastronomía o Conciertos | Pestañas | 2 | 🟡 pestañas listas |
| 3. Selecciona una actividad, lugar o evento | Pantallas de detalle | 2 | ⬜ |
| 4. Pulsa «Ver ubicación» | Botón en el detalle | 3 | ⬜ |
| 5. El mapa se abre y señala el punto | Mapa | 3 | ⬜ |
| 6. El usuario se dirige al lugar | Mapa con su posición y la del lugar | 3 | ⬜ |
| 7. Usa su pulsera en el establecimiento | Lector (celular del establecimiento) | 4 | ⬜ |
| 8. El sistema registra la interacción | Transacción en `interacciones` | 4 | ⬜ |
| 9. Se actualiza el progreso del usuario | Promociones, en tiempo real | 5 | ⬜ |
| 10. Si cumple la condición, se desbloquea la promoción | Promoción pasa a «Desbloqueadas» | 5 | ⬜ |

## 6–8. Navegación, NFC y resultado esperado

- **§6 Navegación** («cualquier elemento seleccionado puede localizarse en el mapa»): cubierto por RF-11.
- **§7 NFC:** se eligió la **opción B** (lector en el establecimiento), la que el PDF recomienda.
- **§8 Resultado esperado:** es la suma de todo lo anterior; se valida con el ensayo de la demo (semana 6).

## Lo que el PDF no pide pero se necesita para que funcione

| Qué | Por qué | Sem. | Estado |
|---|---|---|---|
| Modo canje en el lector | El PDF dice «utilizadas» pero no cómo se usa una promoción | 5 | ⬜ |
| Panel: alta de pulseras (UID + código) y bloqueo | Sin esto no hay pulseras que vincular | 5 | ⬜ |
| Panel: dar a un usuario el rol de establecimiento y asignarle su lugar | El lector necesita saber en qué lugar está | 5 | ⬜ |
| Reglas de seguridad de Firestore | Las de prueba vencen el 31 de octubre | 4 (antes del 31-oct) | ⬜ |
| Versión iPhone (PWA) | Android con APK; iPhone con la PWA publicada en Firebase Hosting (gratis) | 6 | 🟡 PWA configurada |
