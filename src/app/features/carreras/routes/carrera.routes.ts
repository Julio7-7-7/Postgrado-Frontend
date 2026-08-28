import { Routes } from '@angular/router';
import { permisoGuard } from '../../../core/guards/auth.guard';

export const CARRERA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/carrera-list/carrera-list').then(m => m.CarreraListComponent),
    canActivate: [permisoGuard('carreras.ver')],
  },
];