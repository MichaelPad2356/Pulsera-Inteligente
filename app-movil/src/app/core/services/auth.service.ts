import { Injectable, computed, inject, signal } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { documentoEnVivo } from '../en-vivo';
import { AUTH, FIRESTORE } from '../firebase';
import { COL, Rol, Usuario } from '../models';

/** Sesión del usuario y su perfil en `usuarios/{uid}` (RF-01). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(AUTH);
  private readonly db = inject(FIRESTORE);

  /** `undefined` mientras Firebase revisa si ya había sesión. */
  readonly usuarioFirebase = signal<User | null | undefined>(undefined);
  readonly uid = computed(() => this.usuarioFirebase()?.uid ?? null);

  /** Perfil en vivo (nombre, rol, lugar del lector). */
  readonly perfil = documentoEnVivo<Usuario>(() => {
    const uid = this.uid();
    return uid ? doc(this.db, COL.usuarios, uid) : null;
  });
  readonly rol = computed(() => this.perfil()?.rol ?? null);
  readonly esPersonal = computed(() => this.rol() === 'establecimiento' || this.rol() === 'admin');

  constructor() {
    onAuthStateChanged(this.auth, (usuario) => this.usuarioFirebase.set(usuario));
  }

  /** Espera a saber si hay sesión (para los guards al abrir la app). */
  async usuarioActual(): Promise<User | null> {
    await this.auth.authStateReady();
    return this.auth.currentUser;
  }

  /** Rol leído directo de Firestore (los guards no pueden esperar al signal). */
  async rolActual(): Promise<Rol | null> {
    const usuario = await this.usuarioActual();
    if (!usuario) return null;
    const snap = await getDoc(doc(this.db, COL.usuarios, usuario.uid));
    return snap.exists() ? (snap.data() as Usuario).rol : null;
  }

  async registrar(nombre: string, email: string, password: string): Promise<void> {
    const credencial = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(credencial.user, { displayName: nombre });
    const perfil: Usuario = { nombre, email, rol: 'visitante' };
    await setDoc(doc(this.db, COL.usuarios, credencial.user.uid), perfil);
  }

  async iniciarSesion(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  cerrarSesion(): Promise<void> {
    return signOut(this.auth);
  }
}

/** Pantalla de inicio según el rol. */
export function inicioPorRol(rol: Rol | null): string {
  return rol === 'establecimiento' ? '/establecimiento' : '/tabs/conciertos';
}

/** Mensaje en español para los errores de Firebase Auth. */
export function mensajeErrorAuth(error: unknown): string {
  const codigo = (error as { code?: string })?.code ?? '';
  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo.';
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    case 'auth/network-request-failed':
      return 'Sin conexión a internet.';
    default:
      return 'Algo salió mal. Inténtalo de nuevo.';
  }
}
