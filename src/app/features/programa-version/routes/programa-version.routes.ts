import { Routes } from '@angular/router';
import { ProgramaVersionListComponent } from '../pages/programa-version-list/programa-version-list';

export const PROGRAMA_VERSION_ROUTES: Routes = [
  { path: '', component: ProgramaVersionListComponent },
  {
    path: ':versionId/modulos',
    loadChildren: () =>
      import('../../modulo/routes/modulo.routes').then(m => m.MODULO_ROUTES),
  },
  {
    path: ':versionId/ediciones',
    loadChildren: () =>
      import('../../edicion/routes/edicion.routes').then(m => m.EDICION_ROUTES),
  },
];
