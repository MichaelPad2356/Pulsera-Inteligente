/** Error con un mensaje pensado para mostrarse tal cual al usuario. */
export class ErrorConMensaje extends Error {}

/** Mensaje en español para cualquier error (de la app o de Firebase). */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorConMensaje) {
    return error.message;
  }
  const codigo = (error as { code?: string })?.code ?? '';
  if (codigo.endsWith('permission-denied')) {
    return 'No tienes permiso para hacer esto.';
  }
  if (codigo.endsWith('unavailable') || codigo.endsWith('network-request-failed')) {
    return 'Sin conexión a internet. Inténtalo de nuevo.';
  }
  console.error(error);
  return 'Algo salió mal. Inténtalo de nuevo.';
}
