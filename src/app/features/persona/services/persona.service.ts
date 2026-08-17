import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PaginatedPersonas } from '../models/persona.model';

@Injectable({ providedIn: 'root' })
export class PersonaService extends ApiService {
  private readonly endpoint = 'personas';

  getAll(q?: string, rol?: string, page: number = 1, perPage: number = 20): Observable<PaginatedPersonas> {
    let params = new HttpParams()
      .set('page', page)
      .set('per_page', perPage);
    if (q) params = params.set('q', q);
    if (rol) params = params.set('rol', rol);
    return this.http.get<PaginatedPersonas>(`${this.baseUrl}/${this.endpoint}`, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  actualizarRoles(idUsuario: number, roles: number[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/${idUsuario}/roles`, { roles });
  }
}
