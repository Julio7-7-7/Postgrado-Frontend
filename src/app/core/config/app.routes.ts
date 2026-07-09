import { Routes } from '@angular/router';
import { authGuard, permisoGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../../features/login/pages/login').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('../../features/home/pages/home').then(m => m.HomeComponent),
    canActivate: [authGuard()],
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
    path: 'admin',
    loadChildren: () =>
      import('../../features/admin/routes/admin.routes')
      .then(m => m.ADMIN_ROUTES),
    canActivate: [permisoGuard('roles.gestionar')],
  },
  { path: '**', redirectTo: '' },
];

