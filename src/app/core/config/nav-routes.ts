import { Routes, Route } from '@angular/router';
import { permisoGuard } from '../guards/auth.guard';
import { NAV_ITEMS } from './nav.config';

export function buildNavRoutes(): Routes {
  return NAV_ITEMS
    .filter(item => item.build !== false && item.kind && item.load)
    .map(item => {
      const route: Route = {
        path: item.path.replace(/^\//, ''),
        canActivate: [permisoGuard(item.permiso)],
      };
      if (item.kind === 'children') {
        route.loadChildren = item.load;
      } else {
        route.loadComponent = item.load;
      }
      return route;
    });
}
