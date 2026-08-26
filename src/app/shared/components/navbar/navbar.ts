import { Component, inject, computed, signal, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { NAV_MODULES, NavModuleGroup, NavItem } from '../../../core/config/nav.config';

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

  openModule = signal<string | null>(null);

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
    { path: '/docente', label: 'Mi Perfil', icon: 'badge', exact: true, feature: 'docente', permiso: 'notas.ver' },
    { path: '/docente/mis-modulos', label: 'Mis Módulos', icon: 'menu_book', feature: 'docente', permiso: 'notas.ver' },
  ];

  studentModules = computed<NavModuleGroup[]>(() => {
    const items: NavModuleGroup[] = [
      {
        key: 'inicio',
        label: 'Inicio',
        icon: 'home',
        permiso: 'dashboard.ver',
        items: [{ path: '/alumnos/inscripciones', label: 'Mis Inscripciones', icon: 'assignment_ind', feature: 'alumno', permiso: 'dashboard.ver' }],
      },
      {
        key: 'oferta',
        label: 'Oferta Académica',
        icon: 'school',
        permiso: 'dashboard.ver',
        items: [{ path: '/', label: 'Ver Oferta', icon: 'school', feature: 'alumno', permiso: 'dashboard.ver', exact: true }],
      },
    ];
    return items.filter(m => m.items.some(i => this.auth.hasPermiso(i.permiso)));
  });

  adminModules = computed<NavModuleGroup[]>(() => {
    return NAV_MODULES.filter(m => {
      if (m.key === 'inicio') return this.auth.hasPermiso(m.permiso);
      return m.items.some(i => this.auth.hasPermiso(i.permiso));
    });
  });

  docenteModules = computed<NavModuleGroup[]>(() => {
    return [{
      key: 'docente',
      label: 'Docente',
      icon: 'badge',
      permiso: 'notas.ver',
      items: this.docenteItems.filter(i => this.auth.hasPermiso(i.permiso)),
    }];
  });

  visibleModules = computed(() => {
    const user = this.auth.user();
    if (user?.rol === 'alumno') return this.studentModules();
    if (user?.rol === 'docente') return this.docenteModules();
    return this.adminModules();
  });

  toggleModule(key: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.openModule.set(this.openModule() === key ? null : key);
  }

  closeModule(): void {
    this.openModule.set(null);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openModule.set(null);
  }

  isActive(path: string, exact: boolean = false): boolean {
    if (exact) return this.router.url === path;
    return this.router.url.startsWith(path) && path !== '/';
  }

  isModuleActive(module: NavModuleGroup): boolean {
    return module.items.some(i => this.isActive(i.path, i.exact));
  }

  isItemActive(item: NavItem): boolean {
    return this.isActive(item.path, item.exact);
  }

  onNavClick(): void {
    this.openModule.set(null);
  }

  ngOnDestroy(): void {}

  logout() {
    this.auth.logout();
  }

  cambiarRol() {
    this.router.navigate(['/login'], { queryParams: { cambiar: '1' } });
  }
}
