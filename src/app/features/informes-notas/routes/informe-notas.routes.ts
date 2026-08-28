import { Routes } from '@angular/router';
import { permisoGuard } from '../../../core/guards/auth.guard';

export const INFORME_NOTAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/informe-notas/informe-notas').then(m => m.InformeNotasComponent),
    canActivate: [permisoGuard('pagos.ver')],
  },
  {
    path: 'preview',
    loadComponent: () =>
      import('../pages/informe-preview/informe-preview').then(m => m.InformePreviewComponent),
    canActivate: [permisoGuard('pagos.ver')],
  },
];