import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  RolResponse, RolCreate, RolUpdate,
  PermisoResponse,
  UserAdminResponse, UserAdminCreate, UserUpdateRoles,
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService extends ApiService {
  getAllRoles(): Observable<RolResponse[]> {
    return this.http.get<RolResponse[]>(`${this.baseUrl}/roles/`);
  }

  getRol(id: number): Observable<RolResponse> {
    return this.http.get<RolResponse>(`${this.baseUrl}/roles/${id}`);
  }

  createRol(data: RolCreate): Observable<RolResponse> {
    return this.http.post<RolResponse>(`${this.baseUrl}/roles/`, data);
  }

  updateRol(id: number, data: RolUpdate): Observable<RolResponse> {
    return this.http.put<RolResponse>(`${this.baseUrl}/roles/${id}`, data);
  }

  deleteRol(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}`);
  }

  getAllPermisos(): Observable<PermisoResponse[]> {
    return this.http.get<PermisoResponse[]>(`${this.baseUrl}/permisos/`);
  }

  getAllUsers(): Observable<UserAdminResponse[]> {
    return this.http.get<UserAdminResponse[]>(`${this.baseUrl}/usuarios/`);
  }

  getUser(id: number): Observable<UserAdminResponse> {
    return this.http.get<UserAdminResponse>(`${this.baseUrl}/usuarios/${id}`);
  }

  createUser(data: UserAdminCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/usuarios/`, data);
  }

  updateUserRoles(id: number, data: UserUpdateRoles): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/${id}/roles`, data);
  }

  toggleUserActive(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/${id}/activo`, {});
  }
}
