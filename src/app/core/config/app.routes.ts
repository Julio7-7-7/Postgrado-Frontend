import { Routes, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, permisoGuard } from '../guards/auth.guard';

export function dashboardGuard(): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLogged()) {
      router.navigate(['/login']);
      return false;
    }
    if (auth.user()?.profile_type === 'alumno') {
      router.navigate(['/alumnos']);
      return false;
    }
    return true;
  };
}

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../features/public-home/pages/public-home').then(m => m.PublicHomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../../features/login/pages/login').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../../features/home/pages/home').then(m => m.HomeComponent),
    canActivate: [dashboardGuard()],
  },
  {
    path: 'tipos-programa',
    loadChildren: () =>
      import('../../features/tipo-programa/routes/tipo-programa.routes')
      .then(m => m.TIPO_PROGRAMA_ROUTES),
    canActivate: [permisoGuard('tipos_programa.ver')],
  },
  {
    path: 'programas',
    loadChildren: () =>
      import('../../features/programa/routes/programa.routes')
      .then(m => m.PROGRAMA_ROUTES),
    canActivate: [permisoGuard('programas.ver')],
  },
  {
    path: 'docentes',
    loadChildren: () =>
      import('../../features/docente/routes/docente.routes')
      .then(m => m.DOCENTE_ROUTES),
    canActivate: [permisoGuard('docentes.ver')],
  },
  {
    path: 'contrataciones',
    loadChildren: () =>
      import('../../features/contratacion/routes/contratacion.routes')
      .then(m => m.CONTRATACION_ROUTES),
    canActivate: [permisoGuard('contrataciones.ver')],
  },
  {
    path: 'alumnos',
    loadChildren: () =>
      import('../../features/alumno/routes/alumno.routes')
      .then(m => m.ALUMNO_ROUTES),
    canActivate: [authGuard()],
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('../../features/admin/routes/admin.routes')
      .then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard()],
  },
  { path: '**', redirectTo: '' },
];
