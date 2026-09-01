import { Routes } from '@angular/router';
import { permisoGuard } from '../../../core/guards/auth.guard';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/reportes/reportes').then(m => m.ReportesComponent),
    canActivate: [permisoGuard('reportes.ver')],
  },
];
