import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function authGuard(): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLogged()) {
      router.navigate(['/login']);
      return false;
    }
    return true;
  };
}

export function permisoGuard(codigo: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLogged()) {
      router.navigate(['/login']);
      return false;
    }
    if (!auth.hasPermiso(codigo)) {
      router.navigate(['/']);
      return false;
    }
    return true;
  };
}
