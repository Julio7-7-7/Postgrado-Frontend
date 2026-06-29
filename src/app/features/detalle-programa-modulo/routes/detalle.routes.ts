import { Routes } from '@angular/router';

export const DETALLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/detalle-list/detalle-list').then(m => m.DetalleListComponent),
  },
  {
    path: 'gestionar/:detalleId',
    loadComponent: () =>
      import('../pages/detalle-gestionar/detalle-gestionar').then(m => m.DetalleGestionarComponent),
  },
  {
    path: 'editar/:detalleId',
    loadComponent: () =>
      import('../pages/detalle-form/detalle-form').then(m => m.DetalleFormComponent),
  },
  {
    path: 'historial/:detalleId',
    loadComponent: () =>
      import('../pages/historial-page/historial-page').then(m => m.HistorialPageComponent),
  },
];
