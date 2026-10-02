import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { consultaEnVivo } from '../../core/en-vivo';
import { FIRESTORE } from '../../core/firebase';
import { COL, Interaccion, Progreso, Pulsera, Usuario } from '../../core/models';

type Coleccion = (typeof COL)[keyof typeof COL];

/** Cuántas interacciones recientes trae el panel (alcanza para la feria de la demo). */
const LIMITE_INTERACCIONES = 1000;

/**
 * Datos y escrituras del panel administrativo (RF-12). Solo lo usa `features/admin`,
 * y las reglas de Firestore solo lo permiten al rol admin.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly db = inject(FIRESTORE);

  readonly usuarios = consultaEnVivo<Usuario>(() => collection(this.db, COL.usuarios));
  readonly pulseras = consultaEnVivo<Pulsera>(() => collection(this.db, COL.pulseras));
  readonly interacciones = consultaEnVivo<Interaccion>(() =>
    query(
      collection(this.db, COL.interacciones),
      orderBy('fechaHora', 'desc'),
      limit(LIMITE_INTERACCIONES),
    ),
  );
  /** El progreso de todos los usuarios (para las estadísticas de promociones). */
  readonly progresos = consultaEnVivo<Progreso>(() => collectionGroup(this.db, COL.progreso));

  /** Crea (id = null) o reemplaza un documento. Regresa su id. */
  async guardar(coleccion: Coleccion, id: string | null, datos: object): Promise<string> {
    if (id) {
      await setDoc(doc(this.db, coleccion, id), datos);
      return id;
    }
    const nuevo = await addDoc(collection(this.db, coleccion), datos);
    return nuevo.id;
  }

  actualizar(coleccion: Coleccion, id: string, cambios: object): Promise<void> {
    return updateDoc(doc(this.db, coleccion, id), cambios);
  }

  eliminar(coleccion: Coleccion, id: string): Promise<void> {
    return deleteDoc(doc(this.db, coleccion, id));
  }
}
