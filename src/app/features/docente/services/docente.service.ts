import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Docente, DocenteCreate } from '../models/docente.model';

@Injectable({ providedIn: 'root' })
export class DocenteService extends ApiService {
  private readonly endpoint = 'docentes';

  getAll(estado?: string): Observable<Docente[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Docente[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: DocenteCreate): Observable<Docente> {
    return this.http.post<Docente>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<DocenteCreate>): Observable<Docente> {
    return this.http.patch<Docente>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }

  cancelar(id: number): Observable<Docente> {
    return this.http.patch<Docente>(`${this.baseUrl}/${this.endpoint}/${id}/cancelar`, {});
  }
}
