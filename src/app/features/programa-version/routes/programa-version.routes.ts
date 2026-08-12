import { Routes } from '@angular/router';
import { RedirectExplorerComponent } from '../../../shared/components/redirect-explorer/redirect-explorer';

export const PROGRAMA_VERSION_ROUTES: Routes = [
  { path: '', component: RedirectExplorerComponent },
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
