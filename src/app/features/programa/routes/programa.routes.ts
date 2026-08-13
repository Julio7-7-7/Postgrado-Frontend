import { Routes } from '@angular/router';
import { ProgramaExplorerComponent } from '../pages/programa-explorer/programa-explorer';

export const PROGRAMA_ROUTES: Routes = [
  { path: '', component: ProgramaExplorerComponent },
  {
    path: ':id/versiones',
    loadChildren: () =>
      import('../../programa-version/routes/programa-version.routes')
        .then(m => m.PROGRAMA_VERSION_ROUTES),
  },
];
