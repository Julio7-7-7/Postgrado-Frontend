import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AlumnoAdmin, AlumnoAdminUpdate } from '../models/alumnos-admin.model';

@Injectable({ providedIn: 'root' })
export class AlumnosAdminService extends ApiService {
  private readonly endpoint = 'alumnos';

  getAll(): Observable<AlumnoAdmin[]> {
    return this.http.get<AlumnoAdmin[]>(`${this.baseUrl}/${this.endpoint}/`);
  }

  getByPeriodo(anio: number, semestre?: number): Observable<AlumnoAdmin[]> {
    let params = new HttpParams().set('anio', anio);
    if (semestre) {
      params = params.set('semestre', semestre);
    }
    return this.http.get<AlumnoAdmin[]>(`${this.baseUrl}/${this.endpoint}/por-periodo`, { params });
  }

  getById(id: number): Observable<AlumnoAdmin> {
    return this.http.get<AlumnoAdmin>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  update(id: number, data: AlumnoAdminUpdate): Observable<AlumnoAdmin> {
    return this.http.patch<AlumnoAdmin>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }
}
