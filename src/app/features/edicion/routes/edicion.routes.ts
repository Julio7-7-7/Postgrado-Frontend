import { Routes } from '@angular/router';

export const EDICION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/edicion-list/edicion-list').then(m => m.EdicionListComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('../pages/edicion-form/edicion-form').then(m => m.EdicionFormComponent),
  },
  {
    path: 'editar/:edicionId',
    loadComponent: () =>
      import('../pages/edicion-form/edicion-form').then(m => m.EdicionFormComponent),
  },
  {
    path: ':edicionId/modulos',
    loadChildren: () =>
      import('../../detalle-programa-modulo/routes/detalle.routes').then(m => m.DETALLE_ROUTES),
  },
  {
    path: ':edicionId/historial',
    loadComponent: () =>
      import('../../detalle-programa-modulo/pages/historial-edicion-page/historial-edicion-page').then(m => m.HistorialEdicionPageComponent),
  },
];
