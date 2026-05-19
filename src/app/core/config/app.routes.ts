import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../features/home/pages/home').then(m => m.HomeComponent)
  },
  {
    path: 'tipos-programa',
    loadChildren: () =>
      import('../../features/tipo-programa/routes/tipo-programa.routes')
      .then(m => m.TIPO_PROGRAMA_ROUTES)
  },
  {
    path: 'programas',
    loadChildren: () =>
      import('../../features/programa/routes/programa.routes')
      .then(m => m.PROGRAMA_ROUTES)
  },
  { path: '**', redirectTo: '' }
];

