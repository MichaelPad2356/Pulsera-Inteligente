import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol } from '../models';
import { AuthService, inicioPorRol } from '../services/auth.service';

/** Solo con sesión. Si no hay, manda a iniciar sesión y luego regresa a donde iba. */
export const sesionGuard: CanActivateFn = async (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (await auth.usuarioActual()) {
    return true;
  }
  return router.createUrlTree(['/auth/login'], { queryParams: { volver: estado.url } });
};

/** Login y registro: si ya hay sesión, manda a la pantalla de inicio de su rol. */
export const invitadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!(await auth.usuarioActual())) {
    return true;
  }
  return router.parseUrl(inicioPorRol(await auth.rolActual()));
};

/** Solo para ciertos roles (ej. el modo establecimiento). */
export function rolGuard(...roles: Rol[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const rol = await auth.rolActual();
    return rol && roles.includes(rol) ? true : router.parseUrl('/tabs/conciertos');
  };
}
