import { Routes } from '@angular/router';
import { ProgramaListComponent } from '../pages/programa-list/programa-list';
import { ProgramaFormComponent } from '../pages/programa-form/programa-form';

export const PROGRAMA_ROUTES: Routes = [
  { path: '', component: ProgramaListComponent },
  { path: 'nuevo', component: ProgramaFormComponent },
  { path: 'editar/:id', component: ProgramaFormComponent },
  {
    path: ':id/versiones',
    loadChildren: () =>
      import('../../programa-version/routes/programa-version.routes')
        .then(m => m.PROGRAMA_VERSION_ROUTES),
  },
];
