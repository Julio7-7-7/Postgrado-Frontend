import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NAV_ITEMS } from '../config/nav.config';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class NavigationBackService {
  private router = inject(Router);
  private auth = inject(AuthService);

  private _returnUrl: string | null = null;

  setReturn(url: string | null): void {
    this._returnUrl = url;
  }

  clearReturn(): void {
    this._returnUrl = null;
  }

  getReturn(): string | null {
    return this._returnUrl;
  }

  retornar(defaultCommand: string | readonly unknown[], opts?: { queryParams?: Record<string, unknown> }): void {
    const target = this._returnUrl;
    this._returnUrl = null;

    if (target && this.esRetornoPermitido(target) && target.split('?')[0] !== this.router.url.split('?')[0]) {
      this.router.navigateByUrl(target);
      return;
    }

    if (typeof defaultCommand === 'string') {
      this.router.navigateByUrl(defaultCommand);
      return;
    }

    this.router.navigate(defaultCommand as string[], { queryParams: opts?.queryParams });
  }

  esRetornoPermitido(url: string): boolean {
    if (!url || !url.startsWith('/')) return false;
    const path = url.split('?')[0];
    const coincidencias = NAV_ITEMS.filter(i => path === i.path || path.startsWith(`${i.path}/`));
    if (coincidencias.length === 0) return true;
    return coincidencias.some(i => this.auth.hasPermiso(i.permiso));
  }
}