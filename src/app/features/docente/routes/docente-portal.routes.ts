import { Routes } from '@angular/router';
import { permisoGuard } from '../../../core/guards/auth.guard';

export const DOCENTE_PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/docente-portal/docente-portal').then(m => m.DocentePortalComponent),
    canActivate: [permisoGuard('notas.ver')],
  },
  {
    path: 'mis-modulos',
    loadComponent: () =>
      import('../pages/docente-mis-modulos/docente-mis-modulos').then(m => m.DocenteMisModulosComponent),
    canActivate: [permisoGuard('notas.ver')],
  },
  {
    path: 'calificar/:idDpm',
    loadComponent: () =>
      import('../pages/docente-calificar/docente-calificar').then(m => m.DocenteCalificarComponent),
    canActivate: [permisoGuard('notas.subir')],
  },
];
