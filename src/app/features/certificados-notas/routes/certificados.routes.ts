import { Routes } from '@angular/router';
import { permisoGuard } from '../../../core/guards/auth.guard';

export const CERTIFICADOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/certificados-list/certificados-list').then(m => m.CertificadosListComponent),
    canActivate: [permisoGuard('pagos.ver')],
  },
  {
    path: 'preview',
    loadComponent: () =>
      import('../pages/certificado-preview/certificado-preview').then(m => m.CertificadoPreviewComponent),
    canActivate: [permisoGuard('pagos.ver')],
  },
];