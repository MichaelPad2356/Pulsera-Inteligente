// Pruebas de firestore.rules contra el emulador de Firestore.
//   cd pruebas-reglas && npm install && npm test
// Necesita JDK 21 (JAVA_HOME). Cada caso imita una lectura o escritura real de la app;
// si cambias las reglas o la forma en que la app escribe, actualiza estos casos.
import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const RUTA_REGLAS = process.argv[2] ?? '../firestore.rules';
const env = await initializeTestEnvironment({
  projectId: 'demo-pulsera',
  firestore: { rules: readFileSync(RUTA_REGLAS, 'utf8'), host: '127.0.0.1', port: 8080 },
});

const ahora = Timestamp.now();
const DIA = '2026-10-02';

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'usuarios/ana'), { nombre: 'Ana', email: 'ana@x.mx', rol: 'visitante' });
  await setDoc(doc(db, 'usuarios/beto'), { nombre: 'Beto', email: 'beto@x.mx', rol: 'visitante' });
  await setDoc(doc(db, 'usuarios/lector'), { nombre: 'Tacos', email: 't@x.mx', rol: 'establecimiento', lugarId: 'tacos' });
  await setDoc(doc(db, 'usuarios/sinlugar'), { nombre: 'Sin', email: 's@x.mx', rol: 'establecimiento' });
  await setDoc(doc(db, 'usuarios/admin'), { nombre: 'Admin', email: 'a@x.mx', rol: 'admin' });
  await setDoc(doc(db, 'lugares/tacos'), { nombre: 'Tacos', tipo: 'restaurante', activo: true });
  await setDoc(doc(db, 'lugares/foro'), { nombre: 'Foro', tipo: 'foro', activo: true });
  await setDoc(doc(db, 'promociones/p1'), { titulo: '2x1', lugarId: 'tacos', activa: true });
  await setDoc(doc(db, 'pulseras/LIBRE'), { codigo: 'AAAAAA', usuarioId: null, estado: 'activa', vinculadaEn: null });
  await setDoc(doc(db, 'pulseras/DEBETO'), { codigo: 'BBBBBB', usuarioId: 'beto', estado: 'activa', vinculadaEn: ahora });
  await setDoc(doc(db, 'pulseras/BLOQ'), { codigo: 'CCCCCC', usuarioId: null, estado: 'bloqueada', vinculadaEn: null });
  await setDoc(doc(db, 'pulseras/DEANA'), { codigo: 'DDDDDD', usuarioId: 'ana', estado: 'activa', vinculadaEn: ahora });
  await setDoc(doc(db, `interacciones/ana_foro_${DIA}`), { usuarioId: 'ana', pulseraId: 'DEANA', lugarId: 'foro', tipo: 'visita', fechaHora: ahora, dia: DIA });
  await setDoc(doc(db, `interacciones/beto_foro_${DIA}`), { usuarioId: 'beto', pulseraId: 'DEBETO', lugarId: 'foro', tipo: 'visita', fechaHora: ahora, dia: DIA });
  await setDoc(doc(db, 'usuarios/ana/progreso/p1'), { avance: 4, meta: 5, estado: 'en_progreso', contados: ['a', 'b', 'c', 'd'], desbloqueadaEn: null, utilizadaEn: null });
  await setDoc(doc(db, 'usuarios/beto/progreso/p1'), { avance: 5, meta: 5, estado: 'desbloqueada', contados: ['a', 'b', 'c', 'd', 'e'], desbloqueadaEn: ahora, utilizadaEn: null });
});

const anonimo = env.unauthenticatedContext().firestore();
const ana = env.authenticatedContext('ana').firestore();
const nuevo = env.authenticatedContext('nuevo').firestore(); // cuenta recién creada, sin perfil aún
const lector = env.authenticatedContext('lector').firestore();
const sinLugar = env.authenticatedContext('sinlugar').firestore();
const admin = env.authenticatedContext('admin').firestore();

let ok = 0;
const fallas = [];
async function caso(nombre, promesa) {
  try {
    await promesa;
    ok++;
  } catch (e) {
    fallas.push(`${nombre}: ${e.message.split('\n')[0]}`);
  }
}
const visita = (usuarioId, lugarId) => ({ usuarioId, pulseraId: 'X', lugarId, tipo: 'visita', fechaHora: ahora, dia: DIA });

// --- Contenido de la feria ---
await caso('anónimo lee lugares', assertSucceeds(getDocs(collection(anonimo, 'lugares'))));
await caso('anónimo no escribe lugares', assertFails(setDoc(doc(anonimo, 'lugares/x'), { nombre: 'x' })));
await caso('visitante no escribe lugares', assertFails(setDoc(doc(ana, 'lugares/x'), { nombre: 'x' })));
await caso('establecimiento no escribe promociones', assertFails(updateDoc(doc(lector, 'promociones/p1'), { activa: false })));
await caso('admin crea lugar', assertSucceeds(setDoc(doc(admin, 'lugares/nuevo'), { nombre: 'Nuevo', activo: true })));
await caso('admin desactiva promoción', assertSucceeds(updateDoc(doc(admin, 'promociones/p1'), { activa: true })));
await caso('admin borra lugar', assertSucceeds(deleteDoc(doc(admin, 'lugares/nuevo'))));

// --- Registro y perfiles ---
await caso('registro como visitante', assertSucceeds(setDoc(doc(nuevo, 'usuarios/nuevo'), { nombre: 'N', email: 'n@x.mx', rol: 'visitante' })));
const otro = env.authenticatedContext('otro').firestore();
await caso('registro como admin: no', assertFails(setDoc(doc(otro, 'usuarios/otro'), { nombre: 'O', email: 'o@x.mx', rol: 'admin' })));
await caso('registro con lugarId: no', assertFails(setDoc(doc(otro, 'usuarios/otro'), { nombre: 'O', email: 'o@x.mx', rol: 'visitante', lugarId: 'tacos' })));
await caso('crear perfil de otro uid: no', assertFails(setDoc(doc(otro, 'usuarios/ana'), { nombre: 'X', email: 'x', rol: 'visitante' })));
await caso('cambia su nombre', assertSucceeds(updateDoc(doc(ana, 'usuarios/ana'), { nombre: 'Ana María' })));
await caso('no se sube de rol', assertFails(updateDoc(doc(ana, 'usuarios/ana'), { rol: 'admin' })));
await caso('lee su perfil', assertSucceeds(getDoc(doc(ana, 'usuarios/ana'))));
await caso('no lee perfil ajeno', assertFails(getDoc(doc(ana, 'usuarios/beto'))));
await caso('lector lee perfil del visitante', assertSucceeds(getDoc(doc(lector, 'usuarios/ana'))));
await caso('admin lista usuarios', assertSucceeds(getDocs(collection(admin, 'usuarios'))));
await caso('visitante no lista usuarios', assertFails(getDocs(collection(ana, 'usuarios'))));
await caso('admin asigna rol y lugar', assertSucceeds(updateDoc(doc(admin, 'usuarios/sinlugar'), { lugarId: 'foro' })));
await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'usuarios/sinlugar'), { lugarId: null }));

// --- Pulseras ---
await caso('anónimo no lee pulseras', assertFails(getDoc(doc(anonimo, 'pulseras/LIBRE'))));
await caso('busca pulsera por código', assertSucceeds(getDocs(query(collection(ana, 'pulseras'), where('codigo', '==', 'AAAAAA')))));
await caso('no toma pulsera ajena', assertFails(updateDoc(doc(ana, 'pulseras/DEBETO'), { usuarioId: 'ana', vinculadaEn: ahora })));
await caso('no toma pulsera bloqueada', assertFails(updateDoc(doc(ana, 'pulseras/BLOQ'), { usuarioId: 'ana', vinculadaEn: ahora })));
await caso('no se la asigna a otro', assertFails(updateDoc(doc(ana, 'pulseras/LIBRE'), { usuarioId: 'beto', vinculadaEn: ahora })));
await caso('no se desbloquea sola', assertFails(updateDoc(doc(ana, 'pulseras/DEANA'), { estado: 'activa', codigo: 'ZZZZZZ' })));
await caso('visitante no da de alta pulseras', assertFails(setDoc(doc(ana, 'pulseras/NUEVA'), { codigo: 'EEEEEE', usuarioId: null, estado: 'activa', vinculadaEn: null })));
await caso('admin da de alta pulsera', assertSucceeds(setDoc(doc(admin, 'pulseras/NUEVA'), { codigo: 'EEEEEE', usuarioId: null, estado: 'activa', vinculadaEn: null })));
await caso('admin bloquea pulsera', assertSucceeds(updateDoc(doc(admin, 'pulseras/NUEVA'), { estado: 'bloqueada' })));
// Vincular (como en PulserasService.vincular): suelta la anterior y toma la libre, en una transacción.
await caso(
  'transacción de vincular pulsera',
  assertSucceeds(
    runTransaction(ana, async (tx) => {
      const libre = await tx.get(doc(ana, 'pulseras/LIBRE'));
      if (libre.data().usuarioId) throw new Error('ocupada');
      tx.update(doc(ana, 'pulseras/DEANA'), { usuarioId: null, vinculadaEn: null });
      tx.update(doc(ana, 'pulseras/LIBRE'), { usuarioId: 'ana', vinculadaEn: ahora });
    }),
  ),
);

// --- Interacciones (historial) ---
await caso('visitante no registra visitas', assertFails(setDoc(doc(ana, 'interacciones/trampa'), visita('ana', 'tacos'))));
await caso('lector registra en su lugar', assertSucceeds(setDoc(doc(lector, `interacciones/beto_tacos_${DIA}`), visita('beto', 'tacos'))));
await caso('lector no registra en otro lugar', assertFails(setDoc(doc(lector, `interacciones/beto_foro_x`), visita('beto', 'foro'))));
await caso('lector sin lugar no registra', assertFails(setDoc(doc(sinLugar, 'interacciones/y'), visita('beto', 'tacos'))));
await caso('admin registra en cualquier lugar', assertSucceeds(setDoc(doc(admin, `interacciones/ana_tacos_${DIA}`), visita('ana', 'tacos'))));
await caso('nadie edita el historial (lector)', assertFails(updateDoc(doc(lector, `interacciones/beto_tacos_${DIA}`), { dia: '2020-01-01' })));
await caso('visitante consulta su historial', assertSucceeds(getDocs(query(collection(ana, 'interacciones'), where('usuarioId', '==', 'ana')))));
await caso('visitante no lee historial ajeno', assertFails(getDoc(doc(ana, `interacciones/beto_foro_${DIA}`))));
await caso('visitante no lista todo el historial', assertFails(getDocs(collection(ana, 'interacciones'))));
await caso('admin lista todo el historial', assertSucceeds(getDocs(collection(admin, 'interacciones'))));

// --- Progreso ---
await caso('visitante lee su progreso', assertSucceeds(getDocs(collection(ana, 'usuarios/ana/progreso'))));
await caso('visitante no lee progreso ajeno', assertFails(getDocs(collection(ana, 'usuarios/beto/progreso'))));
await caso('visitante no se desbloquea promociones', assertFails(updateDoc(doc(ana, 'usuarios/ana/progreso/p1'), { estado: 'desbloqueada' })));
await caso('admin consulta progreso de todos', assertSucceeds(getDocs(collectionGroup(admin, 'progreso'))));
await caso('visitante no consulta progreso de todos', assertFails(getDocs(collectionGroup(ana, 'progreso'))));

// --- Transacción del lector al registrar una visita (como LectorService.registrarVisita) ---
await caso(
  'transacción del lector: visita + progreso',
  assertSucceeds(
    runTransaction(lector, async (tx) => {
      const pulsera = await tx.get(doc(lector, 'pulseras/LIBRE'));
      const usuarioId = pulsera.data().usuarioId; // ana (vinculada arriba)
      await tx.get(doc(lector, `usuarios/${usuarioId}`));
      const visitaRef = doc(lector, `interacciones/${usuarioId}_tacos_2026-10-03`);
      const existe = await tx.get(visitaRef); // documento que aún no existe
      if (existe.exists()) throw new Error('repetida');
      const progresoRef = doc(lector, `usuarios/${usuarioId}/progreso/p1`);
      await tx.get(progresoRef);
      tx.set(visitaRef, { ...visita(usuarioId, 'tacos'), dia: '2026-10-03', pulseraId: 'LIBRE' });
      tx.set(progresoRef, { avance: 5, meta: 5, estado: 'desbloqueada', contados: ['a', 'b', 'c', 'd', 'tacos'], desbloqueadaEn: ahora, utilizadaEn: null });
    }),
  ),
);

// --- Canje (como LectorService.canjear) ---
await caso(
  'canje: lector de la promoción',
  assertSucceeds(
    runTransaction(lector, async (tx) => {
      await tx.get(doc(lector, 'pulseras/DEBETO'));
      await tx.get(doc(lector, 'promociones/p1'));
      const ref = doc(lector, 'usuarios/beto/progreso/p1');
      await tx.get(ref);
      tx.update(ref, { estado: 'utilizada', utilizadaEn: ahora });
      tx.set(doc(collection(lector, 'interacciones')), { usuarioId: 'beto', pulseraId: 'DEBETO', lugarId: 'tacos', tipo: 'canje', promocionId: 'p1', fechaHora: ahora, dia: DIA });
    }),
  ),
);

console.log(`\nReglas: ${ok} casos OK, ${fallas.length} fallas.`);
for (const f of fallas) console.log(' ✘', f);
await env.cleanup();
process.exit(fallas.length ? 1 : 0);
