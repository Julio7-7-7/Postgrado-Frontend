import { Routes } from '@angular/router';

export const DOCUMENTACION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/documentacion/documentacion').then(m => m.DocumentacionComponent),
  },
  {
    path: ':idEdicion',
    loadComponent: () =>
      import('../pages/doc-matriz/doc-matriz').then(m => m.DocMatrizComponent),
  },
];
