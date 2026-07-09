import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface RolInfo {
  id_rol: number;
  nombre: string;
  descripcion: string;
}

export interface PermisoInfo {
  id_permiso: number;
  codigo: string;
  descripcion: string | null;
}

export interface UserInfo {
  id_usuario: number;
  email: string;
  activo: boolean;
  rol: string;
  id_profile: number | null;
  profile_type: string | null;
  permisos: PermisoInfo[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  readonly user = signal<UserInfo | null>(null);
  readonly token = signal<string | null>(null);
  readonly isLogged = computed(() => this.user() !== null);
  readonly permisos = computed(() => this.user()?.permisos ?? []);

  constructor() {
    const saved = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    if (saved && savedToken) {
      this.user.set(JSON.parse(saved));
      this.token.set(savedToken);
    }
  }

  hasPermiso(codigo: string): boolean {
    return this.permisos().some(p => p.codigo === codigo);
  }

  hasAlgunPermiso(codigos: string[]): boolean {
    return codigos.some(c => this.hasPermiso(c));
  }

  login(email: string, password: string, id_rol: number) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      email, password, id_rol
    });
  }

  guardarSesion(resp: LoginResponse) {
    localStorage.setItem('auth_token', resp.access_token);
    localStorage.setItem('auth_user', JSON.stringify(resp.user));
    this.token.set(resp.access_token);
    this.user.set(resp.user);
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  getRoles() {
    return this.http.get<RolInfo[]>(`${this.apiUrl}/auth/roles`);
  }
}
