# Requerimientos → implementación

Lista de control de **todo** lo que pide [Requerimientos.pdf](Requerimientos.pdf): cada renglón dice cómo se cumple,
en qué parte del código vive y su estado. Antes de la entrega todos los renglones deben estar en ✅.

**Estado:** ✅ hecho y probado · 🟡 hecho, falta probarlo con la pulsera real o publicarlo · ⬜ pendiente  
**Probado** = pasó la prueba de punta a punta en navegador contra Firebase (2 de octubre de 2026).  
**Rutas** relativas a `app-movil/src/app/`.

## RF-01. Registro e identificación del usuario

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Registrarse e iniciar sesión | Firebase Auth con correo y contraseña; sin sesión la app manda a iniciar sesión | `features/auth/` | ✅ |
| Cada usuario tiene un perfil único | Documento `usuarios/{uid}` creado al registrarse | `features/perfil/`, `core/services/auth.service.ts` | ✅ |
| Cada pulsera asociada a un usuario por un identificador único | `pulseras/{UID del chip}.usuarioId`. Se vincula acercando la pulsera al teléfono (abre el enlace grabado o la lee con NFC en Android) o escribiendo su código | `features/perfil/vincular-pulsera/` | ✅ con código · 🟡 con NFC |
| El sistema reconoce y registra las interacciones de la pulsera | El lector identifica la pulsera por UID (o código) → usuario → registra la interacción | `features/establecimiento/lector/` | ✅ con código · 🟡 con NFC |

## RF-02. Sección Cultura

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Mostrar los pabellones culturales | Segmento «Pabellones» (`lugares` tipo `pabellon`) | `features/cultura/` | ✅ |
| Mostrar las actividades programadas | Segmento «Actividades», agrupadas por día | `features/cultura/` | ✅ |
| Cada actividad: nombre, fecha, hora, descripción y lugar | Detalle de la actividad | `features/cultura/actividad-detalle/` | ✅ |
| Opción «Ver ubicación» en cada actividad | Botón en el detalle y en cada renglón de la lista | `shared/components/boton-mapa/` | ✅ |
| Al pulsarla, el mapa se abre y señala el punto | `/tabs/mapa?lugar={id}`: centra el mapa y muestra la tarjeta del lugar | `features/mapa/` | ✅ |

## RF-03. Sección Gastronomía

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Mostrar restaurantes, bares y establecimientos | Segmentos «Restaurantes» y «Bares» | `features/gastronomia/` | ✅ |
| Categoría o apartado «Hecho en Aguascalientes» | Segmento propio (tipo `hecho_en_ags`) | `features/gastronomia/` | ✅ |
| Nombre, categoría, descripción, ubicación, horario y promociones (cuando aplique) | Tarjeta con distintivo de promociones; el detalle del lugar las muestra | `features/lugares/lugar-detalle/` | ✅ |
| Botón para verlo en el mapa | En la tarjeta y en el detalle | `shared/components/boton-mapa/` | ✅ |

## RF-04. Sección Conciertos

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Organizar por Foro del Lago, Foro de las Estrellas, Palenque y otros eventos | Una sección por foro (`lugares` tipo `foro`) + «Otros eventos» | `features/conciertos/` | ✅ |
| Filtrar por fecha, artista y foro | Chips de día (Viernes, Sábado…), buscador de artista y selector de foro | `features/conciertos/` | ✅ |
| Cada evento: artista, fecha, hora, foro, descripción y ubicación | Detalle del evento | `features/conciertos/evento-detalle/` | ✅ |
| Opción «Ir a ubicación» | Botón en el detalle | `features/conciertos/evento-detalle/` | ✅ |
| Navegación: Conciertos → Viernes → Artista → Ver ubicación → Mapa → Foro | Probado de punta a punta | — | ✅ |

## RF-05. Mapa interactivo

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Ubicación actual del usuario por GPS | `@capacitor/geolocation` (GPS nativo en Android, del navegador en la PWA) | `core/services/ubicacion.service.ts` | ✅ |
| Todos los lugares, establecimientos, actividades y eventos registrados | Un marcador por lugar; su tarjeta muestra los próximos eventos y actividades de ese lugar | `features/mapa/` | ✅ |
| Restaurantes, bares, pabellones, foros, promociones y otros puntos | Ícono y color por tipo, filtros por tipo y «Con promoción»; punto verde en lugares con promoción | `features/mapa/`, `core/utils/tipos-lugar.ts` | ✅ |
| Seleccionar un punto para consultar su información | Al tocar un marcador aparece su tarjeta con «Ver detalles» | `features/mapa/` | ✅ |
| Todo lo que tiene ubicación se abre directamente en el mapa | Una sola ruta para todo: `/tabs/mapa?lugar={id}` | `features/mapa/mapa.routes.ts` | ✅ |

## RF-06. Ubicación del usuario

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Solicitar permiso de ubicación | Al abrir el mapa: diálogo nativo en Android, del navegador en la PWA; aviso si se niega | `core/services/ubicacion.service.ts` | ✅ |
| Marcador con la posición del usuario | Punto azul «Estás aquí» que se actualiza; botón para centrar | `features/mapa/` | ✅ |
| Ver lugares cercanos según su posición | Botón «Cerca de ti»: lista ordenada por distancia | `features/mapa/` | ✅ |

## RF-07. Integración NFC/RFID

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Cada pulsera tiene un identificador único | UID del chip NTAG213 = id del documento en `pulseras` | `core/models/pulsera.model.ts` | ✅ |
| Los establecimientos tienen un mecanismo para leer la pulsera | Celular Android con NFC y la app en modo establecimiento (opción B del PDF) | `features/establecimiento/lector/`, `core/services/nfc.service.ts` | 🟡 falta probar con stickers |
| Al acercar la pulsera se identifica al usuario y se registra la interacción | Lee el UID → busca la pulsera → transacción de Firestore | `core/services/lector.service.ts` | ✅ con código · 🟡 con NFC |
| La interacción se asocia con lugar, fecha y hora | `interacciones`: `lugarId`, `fechaHora`, `dia` | `core/models/interaccion.model.ts` | ✅ |
| Actualiza el progreso y desbloquea promociones | La misma transacción avanza todas las promociones vigentes | `core/services/lector.service.ts`, `core/logica/promociones.ts` | ✅ |

## RF-08. Sistema de promociones

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Registrar cuántos lugares, establecimientos o eventos visitó | Contadores en el perfil: lugares, eventos, visitas y promociones usadas | `features/perfil/`, `core/services/historial.service.ts` | ✅ |
| Regla configurable: número de establecimientos visitados | Regla `cantidad` (N lugares distintos) | `core/logica/promociones.ts` | ✅ |
| Regla configurable: lugares específicos | Regla `lugares` (todos los de una lista) | `core/logica/promociones.ts` | ✅ |
| Regla configurable: participación en eventos | Regla `eventos` (pasar la pulsera en el foro el día del evento) | `core/logica/promociones.ts` | ✅ |
| Mostrar promociones disponibles, desbloqueadas y utilizadas | Tres segmentos | `features/promociones/` | ✅ |
| Cada promoción: establecimiento, condiciones, vigencia y ubicación | Detalle de la promoción + «Ver dónde se canjea» | `features/promociones/promocion-detalle/` | ✅ |

## RF-09. Historial de interacciones

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Guardar el historial de visitas e interacciones | Colección `interacciones`; las reglas impiden editarla | `firestore.rules` | ✅ |
| Cada registro: usuario, lugar, fecha, hora y tipo | Campos `usuarioId`, `lugarId`, `fechaHora`, `tipo` (+ evento o promoción) | `core/models/interaccion.model.ts` | ✅ |
| El usuario consulta su progreso o historial | Pantalla Historial; progreso en Promociones | `features/perfil/historial/` | ✅ |

## RF-10. Progreso del usuario

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Avance visual, ej. «3 de 5 establecimientos visitados» | Barra de progreso por promoción | `shared/components/progreso-promocion/` | ✅ |
| Cuántas interacciones faltan | «Te faltan 2 lugares» | `shared/components/progreso-promocion/` | ✅ |
| Se actualiza solo después de cada interacción válida | Listeners en tiempo real + avisos «Visita registrada» y «¡Desbloqueaste…!» en el teléfono del visitante | `core/en-vivo.ts`, `core/services/avisos.service.ts` | ✅ |

## RF-11. Integración entre módulos

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Cultura, Gastronomía, Conciertos y Promociones conectados con el Mapa | Todos usan el mismo botón y la misma ruta al mapa | `shared/components/boton-mapa/` | ✅ |
| Todo elemento con ubicación tiene acceso directo al mapa | Actividad, lugar, evento y promoción (y en las listas) | detalles de cada sección | ✅ |
| El mapa se abre centrado en el lugar seleccionado | `?lugar=` centra el mapa y abre la tarjeta | `features/mapa/` | ✅ |

## RF-12. Panel administrativo

Dentro de la misma app en `/admin` (solo rol admin), pensado para computadora. Código en `features/admin/`.

| Requisito del PDF | Cómo se cumple | Dónde | Estado |
|---|---|---|---|
| Agregar, editar y eliminar establecimientos | Lugares: alta, edición, activar/desactivar y eliminar (si nada lo usa) | `features/admin/lugares/` | ✅ |
| Agregar y modificar actividades culturales y conciertos | Listas y formularios de actividades y eventos | `features/admin/actividades/`, `features/admin/eventos/` | ✅ |
| Crear, editar y desactivar promociones | Formulario con las 3 reglas + interruptor «Activa» | `features/admin/promociones/` | ✅ |
| Registrar o modificar coordenadas y ubicaciones | Mapa en el formulario del lugar: tocar o arrastrar el marcador | `features/admin/components/selector-ubicacion.component.ts` | ✅ |
| Consultar interacciones y estadísticas básicas | Interacciones con filtros; resumen con totales, lugares más visitados, visitas por día y promociones | `features/admin/interacciones/`, `features/admin/resumen/` | ✅ |

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

| Paso del PDF | Pantalla | Estado |
|---|---|---|
| 1. El usuario abre la aplicación | Login o, con sesión, Conciertos | ✅ |
| 2. Consulta Cultura, Gastronomía o Conciertos | Pestañas | ✅ |
| 3. Selecciona una actividad, lugar o evento | Pantallas de detalle | ✅ |
| 4. Pulsa «Ver ubicación» | Botón en el detalle | ✅ |
| 5. El mapa se abre y señala el punto | Mapa centrado con la tarjeta del lugar | ✅ |
| 6. El usuario se dirige al lugar | Mapa con su posición y la del lugar | ✅ |
| 7. Usa su pulsera en el establecimiento | Lector del establecimiento | 🟡 probado con código; falta con NFC |
| 8. El sistema registra la interacción | Transacción en `interacciones` | ✅ |
| 9. Se actualiza el progreso del usuario | Promociones, en tiempo real, con aviso | ✅ |
| 10. Si cumple la condición, se desbloquea la promoción | Pasa a «Desbloqueadas» con aviso «¡Desbloqueaste…!» | ✅ |

## 6–8. Navegación, NFC y resultado esperado

- **§6 Navegación** («cualquier elemento seleccionado puede localizarse en el mapa»): cubierto por RF-11. ✅
- **§7 NFC:** se eligió la **opción B** (lector en el establecimiento), la que el PDF recomienda. 🟡 falta probar con los stickers.
- **§8 Resultado esperado:** la suma de todo lo anterior; se valida en el ensayo de la demo.

## Lo que el PDF no pide pero se necesita para que funcione

| Qué | Por qué | Estado |
|---|---|---|
| Modo canje en el lector | El PDF dice «utilizadas» pero no cómo se usa una promoción | ✅ |
| Alta de pulseras (lector en modo Alta; alta manual por UID en el panel) y bloqueo | Sin esto no hay pulseras que vincular | ✅ panel · 🟡 modo Alta con NFC |
| Panel: dar a un usuario el rol de establecimiento y asignarle su lugar | El lector necesita saber en qué lugar está | ✅ |
| Reglas de seguridad de Firestore | Las de prueba vencen el 31 de octubre | 🟡 escritas y probadas (46 casos), falta publicarlas |
| Versión iPhone (PWA) | Android con APK; iPhone con la PWA en Firebase Hosting | 🟡 configurada, falta publicarla |
