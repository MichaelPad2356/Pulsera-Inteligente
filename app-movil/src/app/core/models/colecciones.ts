// Nombres de las colecciones de Firestore. Usar siempre estas constantes, nunca texto suelto.
export const COL = {
  usuarios: 'usuarios',
  pulseras: 'pulseras',
  lugares: 'lugares',
  actividades: 'actividades',
  eventos: 'eventos',
  promociones: 'promociones',
  interacciones: 'interacciones',
  progreso: 'progreso', // subcolección: usuarios/{uid}/progreso/{promocionId}
} as const;

/** Documento leído de Firestore junto con su id. */
export type ConId<T> = T & { id: string };
