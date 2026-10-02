// Carga datos de ejemplo en Firestore (solo para desarrollo y la demo).
//   cd app-movil && npm run seed
// Usa ids fijos: correrlo de nuevo sobrescribe estos documentos, no duplica.
// Ojo: también pisa los cambios que se hayan hecho desde el panel a estos mismos ids.
//
// Las coordenadas son aproximadas (zona de la Feria de San Marcos); se corrigen desde el panel.
// Las fechas son relativas: conciertos y actividades caen el próximo viernes, sábado y domingo.

import { initializeApp } from 'firebase/app';
import { doc, getFirestore, terminate, writeBatch } from 'firebase/firestore';

import { firebaseConfig } from '../src/environments/firebase.config.ts';
import type { Actividad, Evento, Lugar, Promocion } from '../src/app/core/models/index.ts';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Fechas ---------------------------------------------------------------
const ZONA = 'America/Mexico_City'; // Aguascalientes, sin horario de verano

function hoyEnAgs(): Date {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA })
    .format(new Date())
    .split('-')
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function iso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * 86_400_000);
}

const hoy = hoyEnAgs();
const viernes = sumarDias(hoy, (5 - hoy.getUTCDay() + 7) % 7);
const VIE = iso(viernes);
const SAB = iso(sumarDias(viernes, 1));
const DOM = iso(sumarDias(viernes, 2));

// --- Lugares --------------------------------------------------------------
const lugares: Record<string, Lugar> = {
  'foro-estrellas': {
    nombre: 'Foro de las Estrellas',
    tipo: 'foro',
    descripcion: 'El foro principal de la feria, con conciertos gratuitos cada noche.',
    horario: '18:00 – 00:00',
    lat: 21.8846,
    lng: -102.2993,
    activo: true,
  },
  'foro-lago': {
    nombre: 'Foro del Lago',
    tipo: 'foro',
    descripcion: 'Escenario al aire libre junto al lago de la Isla San Marcos.',
    horario: '17:00 – 23:00',
    lat: 21.8905,
    lng: -102.3065,
    activo: true,
  },
  palenque: {
    nombre: 'Palenque de la Feria',
    tipo: 'foro',
    descripcion: 'Palenque con presentaciones estelares cada noche.',
    horario: '20:00 – 03:00',
    lat: 21.8829,
    lng: -102.2988,
    activo: true,
  },
  'teatro-pueblo': {
    nombre: 'Teatro del Pueblo',
    tipo: 'foro',
    descripcion: 'Espectáculos familiares, grupos locales y bandas emergentes.',
    horario: '12:00 – 22:00',
    lat: 21.881,
    lng: -102.301,
    activo: true,
  },
  'pabellon-cultural': {
    nombre: 'Pabellón Cultural',
    tipo: 'pabellon',
    descripcion: 'Exposiciones de arte, talleres y danza tradicional.',
    horario: '10:00 – 21:00',
    lat: 21.8795,
    lng: -102.3035,
    activo: true,
  },
  'pabellon-ciencia': {
    nombre: 'Pabellón de Ciencia y Tecnología',
    tipo: 'pabellon',
    descripcion: 'Demostraciones interactivas, robótica y planetario.',
    horario: '10:00 – 20:00',
    lat: 21.8802,
    lng: -102.3047,
    activo: true,
  },
  'pabellon-tradiciones': {
    nombre: 'Pabellón de Tradiciones',
    tipo: 'pabellon',
    descripcion: 'Charrería, deshilado y oficios tradicionales de Aguascalientes.',
    horario: '10:00 – 21:00',
    lat: 21.8788,
    lng: -102.3022,
    activo: true,
  },
  'antojitos-feria': {
    nombre: 'Antojitos La Feria',
    tipo: 'restaurante',
    descripcion: 'Gorditas, enchiladas y pozole.',
    horario: '12:00 – 01:00',
    lat: 21.8818,
    lng: -102.3028,
    activo: true,
  },
  'tacos-jardin': {
    nombre: 'Tacos El Jardín',
    tipo: 'restaurante',
    descripcion: 'Tacos al pastor y de birria a un costado del Jardín de San Marcos.',
    horario: '13:00 – 02:00',
    lat: 21.8791,
    lng: -102.3012,
    activo: true,
  },
  'cantina-parian': {
    nombre: 'Cantina El Parián',
    tipo: 'bar',
    descripcion: 'Cantina con música en vivo y botanas.',
    horario: '16:00 – 03:00',
    lat: 21.8823,
    lng: -102.3041,
    activo: true,
  },
  'bar-terraza': {
    nombre: 'La Terraza San Marcos',
    tipo: 'bar',
    descripcion: 'Terraza con vista al recinto ferial, cerveza artesanal y mezcal.',
    horario: '17:00 – 02:00',
    lat: 21.8836,
    lng: -102.3017,
    activo: true,
  },
  'vinos-ags': {
    nombre: 'Vinos de Aguascalientes',
    tipo: 'hecho_en_ags',
    descripcion: 'Degustación de vinos de casas vinícolas del estado.',
    horario: '12:00 – 22:00',
    lat: 21.8799,
    lng: -102.3003,
    activo: true,
  },
  'dulces-tipicos': {
    nombre: 'Dulces Típicos Hidrocálidos',
    tipo: 'hecho_en_ags',
    descripcion: 'Cajeta, jamoncillo, guayaba y dulces de leche hechos en Aguascalientes.',
    horario: '11:00 – 22:00',
    lat: 21.8807,
    lng: -102.3031,
    activo: true,
  },
  'deshilado-ags': {
    nombre: 'Deshilado de Aguascalientes',
    tipo: 'hecho_en_ags',
    descripcion: 'Artesanía de deshilado hecha por artesanas locales.',
    horario: '10:00 – 21:00',
    lat: 21.8785,
    lng: -102.3044,
    activo: true,
  },
};

// --- Actividades culturales -----------------------------------------------
const actividades: Record<string, Actividad> = {
  'taller-deshilado': {
    nombre: 'Taller de deshilado',
    descripcion: 'Aprende la técnica básica del deshilado con artesanas locales.',
    fecha: VIE,
    hora: '11:00',
    lugarId: 'pabellon-tradiciones',
  },
  'danza-folklorica': {
    nombre: 'Ballet folklórico',
    descripcion: 'Presentación de danzas tradicionales de la región.',
    fecha: VIE,
    hora: '18:00',
    lugarId: 'pabellon-cultural',
  },
  'expo-grabado': {
    nombre: 'Exposición de grabado',
    descripcion: 'Grabado mexicano inspirado en la obra de José Guadalupe Posada.',
    fecha: SAB,
    hora: '10:00',
    lugarId: 'pabellon-cultural',
  },
  robotica: {
    nombre: 'Muestra de robótica',
    descripcion: 'Equipos de preparatorias y universidades muestran sus robots.',
    fecha: SAB,
    hora: '12:00',
    lugarId: 'pabellon-ciencia',
  },
  planetario: {
    nombre: 'Función de planetario',
    descripcion: 'Recorrido por el cielo nocturno de Aguascalientes.',
    fecha: SAB,
    hora: '17:00',
    lugarId: 'pabellon-ciencia',
  },
  charreria: {
    nombre: 'Exhibición de charrería',
    descripcion: 'Suertes charras y escaramuzas.',
    fecha: DOM,
    hora: '13:00',
    lugarId: 'pabellon-tradiciones',
  },
};

// --- Conciertos -----------------------------------------------------------
// Artistas ficticios: el equipo de mercadotecnia pone la cartelera real.
const eventos: Record<string, Evento> = {
  'vie-estrellas': {
    artista: 'Los Tigres del Desierto',
    descripcion: 'Norteño clásico para abrir el fin de semana.',
    fecha: VIE,
    hora: '21:00',
    lugarId: 'foro-estrellas',
  },
  'vie-lago': {
    artista: 'Sonora Hidrocálida',
    descripcion: 'Cumbia y salsa junto al lago.',
    fecha: VIE,
    hora: '19:00',
    lugarId: 'foro-lago',
  },
  'vie-palenque': {
    artista: 'Mariachi Real de San Marcos',
    descripcion: 'Noche de mariachi en el palenque.',
    fecha: VIE,
    hora: '23:00',
    lugarId: 'palenque',
  },
  'sab-estrellas': {
    artista: 'Banda La Feria',
    descripcion: 'Banda sinaloense, el concierto más esperado del sábado.',
    fecha: SAB,
    hora: '21:00',
    lugarId: 'foro-estrellas',
  },
  'sab-lago': {
    artista: 'Electro Ags Collective',
    descripcion: 'DJs locales con música electrónica.',
    fecha: SAB,
    hora: '20:00',
    lugarId: 'foro-lago',
  },
  'sab-teatro': {
    artista: 'Rock en el Barrio',
    descripcion: 'Bandas emergentes de rock de Aguascalientes.',
    fecha: SAB,
    hora: '17:00',
    lugarId: 'teatro-pueblo',
  },
  'dom-estrellas': {
    artista: 'Grupo Cielo Azul',
    descripcion: 'Grupera romántica para cerrar la semana.',
    fecha: DOM,
    hora: '20:00',
    lugarId: 'foro-estrellas',
  },
  'dom-palenque': {
    artista: 'Voces del Bajío',
    descripcion: 'Baladas y regional mexicano.',
    fecha: DOM,
    hora: '22:00',
    lugarId: 'palenque',
  },
};

// --- Promociones ----------------------------------------------------------
const VIGENCIA_INICIO = iso(hoy);
const VIGENCIA_FIN = iso(sumarDias(hoy, 60));

const promociones: Record<string, Promocion> = {
  'recorrido-5': {
    titulo: '2x1 en tacos',
    lugarId: 'tacos-jardin',
    condiciones: 'Visita 5 lugares distintos con tu pulsera. Válido una vez por persona.',
    regla: { tipo: 'cantidad', meta: 5 },
    vigenciaInicio: VIGENCIA_INICIO,
    vigenciaFin: VIGENCIA_FIN,
    activa: true,
  },
  'ruta-hecho-en-ags': {
    titulo: 'Copa de vino de cortesía',
    lugarId: 'vinos-ags',
    condiciones: 'Visita los 3 puestos de Hecho en Aguascalientes.',
    regla: {
      tipo: 'lugares',
      meta: 3,
      lugaresIds: ['vinos-ags', 'dulces-tipicos', 'deshilado-ags'],
    },
    vigenciaInicio: VIGENCIA_INICIO,
    vigenciaFin: VIGENCIA_FIN,
    activa: true,
  },
  'ruta-cultural': {
    titulo: '15% de descuento en la cantina',
    lugarId: 'cantina-parian',
    condiciones: 'Visita los 3 pabellones culturales. No acumulable con otras promociones.',
    regla: {
      tipo: 'lugares',
      meta: 3,
      lugaresIds: ['pabellon-cultural', 'pabellon-ciencia', 'pabellon-tradiciones'],
    },
    vigenciaInicio: VIGENCIA_INICIO,
    vigenciaFin: VIGENCIA_FIN,
    activa: true,
  },
  'fan-conciertos': {
    titulo: 'Bebida gratis en La Terraza',
    lugarId: 'bar-terraza',
    condiciones: 'Asiste a 2 conciertos: pasa tu pulsera en el foro el día del evento.',
    regla: { tipo: 'eventos', meta: 2 },
    vigenciaInicio: VIGENCIA_INICIO,
    vigenciaFin: VIGENCIA_FIN,
    activa: true,
  },
};

// --- Escritura ------------------------------------------------------------
const colecciones = { lugares, actividades, eventos, promociones };

const batch = writeBatch(db);
for (const [coleccion, docs] of Object.entries(colecciones)) {
  for (const [id, datos] of Object.entries(docs)) {
    batch.set(doc(db, coleccion, id), datos);
  }
}
await batch.commit();

for (const [coleccion, docs] of Object.entries(colecciones)) {
  console.log(`${coleccion}: ${Object.keys(docs).length}`);
}
console.log(`Conciertos y actividades: viernes ${VIE}, sábado ${SAB}, domingo ${DOM}`);
await terminate(db);
