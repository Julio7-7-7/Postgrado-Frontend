import { Routes } from '@angular/router';
import { permisoGuard } from '../../../core/guards/auth.guard';

export const MODALIDAD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/modalidad-list/modalidad-list').then(m => m.ModalidadListComponent),
    canActivate: [permisoGuard('modalidades_academicas.ver')],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/modalidad-detail/modalidad-detail').then(m => m.ModalidadDetailComponent),
  },
];
