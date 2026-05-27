import { Routes } from '@angular/router';

export const DETALLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/detalle-list/detalle-list').then(m => m.DetalleListComponent),
  },
  {
    path: 'editar/:detalleId',
    loadComponent: () =>
      import('../pages/detalle-form/detalle-form').then(m => m.DetalleFormComponent),
  },
];
