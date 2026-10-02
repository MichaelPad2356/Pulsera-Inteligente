import { Signal, effect, signal } from '@angular/core';
import { DocumentReference, Query, onSnapshot } from 'firebase/firestore';

import { ConId } from './models';

// Datos de Firestore en tiempo real como signals de Angular (RF-10: el progreso se
// actualiza solo). Cuando la consulta depende de otro signal (ej. el usuario con sesión),
// se vuelve a suscribir sola al cambiar. Llamar dentro de un contexto de inyección
// (inicialización de un servicio o componente).

/**
 * Colección o consulta en vivo.
 * `undefined` = cargando; `[]` = sin resultados o sin consulta (ej. sin sesión).
 */
export function consultaEnVivo<T>(consulta: () => Query | null): Signal<ConId<T>[] | undefined> {
  const datos = signal<ConId<T>[] | undefined>(undefined);
  effect((alLimpiar) => {
    const q = consulta();
    if (!q) {
      datos.set([]);
      return;
    }
    datos.set(undefined);
    const cancelar = onSnapshot(
      q,
      (snap) => datos.set(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }))),
      (error) => {
        console.error('Firestore:', error);
        datos.set([]);
      },
    );
    alLimpiar(cancelar);
  });
  return datos.asReadonly();
}

/**
 * Documento en vivo.
 * `undefined` = cargando; `null` = no existe o no hay referencia.
 */
export function documentoEnVivo<T>(
  referencia: () => DocumentReference | null,
): Signal<ConId<T> | null | undefined> {
  const datos = signal<ConId<T> | null | undefined>(undefined);
  effect((alLimpiar) => {
    const ref = referencia();
    if (!ref) {
      datos.set(null);
      return;
    }
    datos.set(undefined);
    const cancelar = onSnapshot(
      ref,
      (snap) => datos.set(snap.exists() ? { ...(snap.data() as T), id: snap.id } : null),
      (error) => {
        console.error('Firestore:', error);
        datos.set(null);
      },
    );
    alLimpiar(cancelar);
  });
  return datos.asReadonly();
}
