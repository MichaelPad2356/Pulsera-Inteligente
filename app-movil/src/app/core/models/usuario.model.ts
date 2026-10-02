export type Rol = 'visitante' | 'establecimiento' | 'admin';

/** usuarios/{uid} — el id es el uid de Firebase Auth (RF-01: perfil único). */
export interface Usuario {
  nombre: string;
  email: string;
  rol: Rol;
  /** Solo si rol = 'establecimiento': el lugar donde está su lector. */
  lugarId?: string;
}
