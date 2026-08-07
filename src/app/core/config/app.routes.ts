import { Routes, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, permisoGuard } from '../guards/auth.guard';
import { buildNavRoutes } from './nav-routes';

export function dashboardGuard(): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLogged()) {
      router.navigate(['/login']);
      return false;
    }
    if (auth.user()?.rol === 'alumno') {
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
    path: 'registro',
    loadComponent: () =>
      import('../../features/login/pages/register').then(m => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../../features/home/pages/home').then(m => m.HomeComponent),
    canActivate: [dashboardGuard()],
  },
  {
    path: 'requisitos',
    loadChildren: () =>
      import('../../features/requisitos/routes/requisitos.routes')
      .then(m => m.REQUISITOS_ROUTES),
  },
  {
    path: 'modalidades',
    loadChildren: () =>
      import('../../features/modalidad/routes/modalidad.routes')
      .then(m => m.MODALIDAD_ROUTES),
  },
  {
    path: 'alumnos',
    loadChildren: () =>
      import('../../features/alumno/routes/alumno.routes')
      .then(m => m.ALUMNO_ROUTES),
    canActivate: [authGuard()],
  },
  {
    path: 'docente',
    loadChildren: () =>
      import('../../features/docente/routes/docente-portal.routes')
      .then(m => m.DOCENTE_PORTAL_ROUTES),
  },
  {
    path: 'solicitudes/:idSolicitud/revisar',
    loadComponent: () =>
      import('../../features/inscripciones/pages/revisar-incorporacion/revisar-incorporacion').then(m => m.RevisarIncorporacionComponent),
    canActivate: [permisoGuard('alumnos.editar')],
  },
  {
    path: 'requisitos-incorporacion',
    loadComponent: () =>
      import('../../features/inscripciones/pages/gestionar-requisitos-incorporacion/gestionar-requisitos-incorporacion').then(m => m.GestionarRequisitosIncorporacionComponent),
    canActivate: [permisoGuard('alumnos.editar')],
  },
  {
    path: 'transcript/:idAlumno',
    loadComponent: () =>
      import('../../features/transcript/pages/transcript/transcript').then(m => m.TranscriptComponent),
    canActivate: [permisoGuard('alumnos.ver')],
  },
  ...buildNavRoutes(),
  { path: '**', redirectTo: '' },
];
