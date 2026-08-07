import { Component, inject, computed, signal, effect, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { NAV_ITEMS, NAV_GROUP_LABELS, NavItem } from '../../../core/config/nav.config';

interface NavRow {
  item: NavItem;
  sep: string | null;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnDestroy {
  router = inject(Router);
  auth = inject(AuthService);

  private resizeObs = new ResizeObserver(() => this.checkOverflow());
  private navScrollRef = viewChild<ElementRef<HTMLDivElement>>('navScroll');
  hasOverflow = signal(false);

  constructor() {
    effect(() => {
      this.navGroups();
      const el = this.navScrollRef()?.nativeElement;
      if (el) {
        this.resizeObs.disconnect();
        this.resizeObs.observe(el);
        requestAnimationFrame(() => this.checkOverflow());
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObs.disconnect();
  }

  user = computed(() => this.auth.user());
  isLogged = computed(() => this.auth.isLogged());
  hasMultipleRoles = computed(() => this.auth.roles().length > 1);

  profileRoute = computed(() => {
    const user = this.auth.user();
    if (!user) return null;
    if (user.rol === 'alumno') return '/alumnos/perfil';
    if (user.rol === 'docente') return '/docente';
    return null;
  });

  docenteItems: NavItem[] = [
    { path: '/docente', label: 'Mi Perfil', icon: 'badge', exact: true, feature: 'docente', permiso: 'notas.ver', group: 'docentes' },
    { path: '/docente/mis-modulos', label: 'Mis Módulos', icon: 'menu_book', feature: 'docente', permiso: 'notas.ver', group: 'docentes' },
  ];

  studentItems: NavItem[] = [
    { path: '/alumnos/inscripciones', label: 'Mis Inscripciones', icon: 'assignment_ind', feature: 'alumno', permiso: 'dashboard.ver', group: 'estudiantes' },
    { path: '/', label: 'Oferta Académica', icon: 'school', exact: true, feature: 'alumno', permiso: 'dashboard.ver', group: 'catalogos' },
  ];

  private navItems = computed(() => {
    const user = this.auth.user();
    if (user?.rol === 'alumno') {
      return this.studentItems.filter(item => this.auth.hasPermiso(item.permiso));
    }
    if (user?.rol === 'docente') {
      return this.docenteItems.filter(item => this.auth.hasPermiso(item.permiso));
    }
    return NAV_ITEMS.filter(item => this.auth.hasPermiso(item.permiso));
  });

  navGroups = computed<NavRow[]>(() => {
    const items = this.navItems();
    return items.map((item, i) => ({
      item,
      sep: i > 0 && items[i - 1].group !== item.group
        ? NAV_GROUP_LABELS[item.group ?? 'inicio']
        : null,
    }));
  });

  private checkOverflow(): void {
    const el = this.navScrollRef()?.nativeElement;
    this.hasOverflow.set(!!el && el.scrollWidth > el.clientWidth + 1);
  }

  scrollNav(dir: number): void {
    const el = this.navScrollRef()?.nativeElement;
    if (el) {
      el.scrollBy({ left: dir * 260, behavior: 'smooth' });
    }
  }

  isActive(path: string, exact: boolean = false): boolean {
    if (exact) return this.router.url === path;
    return this.router.url.startsWith(path) && path !== '/';
  }

  logout() {
    this.auth.logout();
  }
}
