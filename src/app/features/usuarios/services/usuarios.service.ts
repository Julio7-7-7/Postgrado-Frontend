import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  UserAdminResponse, UserAdminCreate, UserAdminUpdate,
  UserUpdateRoles, PaginatedUsersResponse,
} from '../models/usuarios.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService extends ApiService {
  getAll(page: number = 1, perPage: number = 20): Observable<PaginatedUsersResponse> {
    return this.http.get<PaginatedUsersResponse>(`${this.baseUrl}/usuarios/?page=${page}&per_page=${perPage}`);
  }

  getById(id: number): Observable<UserAdminResponse> {
    return this.http.get<UserAdminResponse>(`${this.baseUrl}/usuarios/${id}`);
  }

  create(data: UserAdminCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/usuarios/`, data);
  }

  update(id: number, data: UserAdminUpdate): Observable<UserAdminResponse> {
    return this.http.patch<UserAdminResponse>(`${this.baseUrl}/usuarios/${id}`, data);
  }

  updateRoles(id: number, data: UserUpdateRoles): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/${id}/roles`, data);
  }

  toggleActive(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/${id}/activo`, {});
  }
}
