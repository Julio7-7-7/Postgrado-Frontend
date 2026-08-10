import { Routes } from '@angular/router';
import { ProgramaListComponent } from '../pages/programa-list/programa-list';

export const PROGRAMA_ROUTES: Routes = [
  { path: '', component: ProgramaListComponent },
  {
    path: ':id/versiones',
    loadChildren: () =>
      import('../../programa-version/routes/programa-version.routes')
        .then(m => m.PROGRAMA_VERSION_ROUTES),
  },
];
