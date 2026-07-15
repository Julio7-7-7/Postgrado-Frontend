import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { RolResponse, RolCreate, RolUpdate, PermisoResponse } from '../models/roles.model';

@Injectable({ providedIn: 'root' })
export class RolesService extends ApiService {
  getAll(): Observable<RolResponse[]> {
    return this.http.get<RolResponse[]>(`${this.baseUrl}/roles/`);
  }

  getById(id: number): Observable<RolResponse> {
    return this.http.get<RolResponse>(`${this.baseUrl}/roles/${id}`);
  }

  create(data: RolCreate): Observable<RolResponse> {
    return this.http.post<RolResponse>(`${this.baseUrl}/roles/`, data);
  }

  update(id: number, data: RolUpdate): Observable<RolResponse> {
    return this.http.put<RolResponse>(`${this.baseUrl}/roles/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}`);
  }

  getAllPermisos(): Observable<PermisoResponse[]> {
    return this.http.get<PermisoResponse[]>(`${this.baseUrl}/permisos/`);
  }
}
