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
];
