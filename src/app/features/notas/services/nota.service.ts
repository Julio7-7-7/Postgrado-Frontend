import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AlumnoNotas, NotaCreate, NotaUpdate, NotaResponse, MisNotasResponse,
} from '../models/nota.model';

@Injectable({ providedIn: 'root' })
export class NotaService extends ApiService {

  getNotasPorEdicion(idEdicion: number): Observable<AlumnoNotas[]> {
    return this.http.get<AlumnoNotas[]>(`${this.baseUrl}/notas/por-edicion/${idEdicion}`);
  }

  getMisNotas(idDetalle: number): Observable<MisNotasResponse> {
    return this.http.get<MisNotasResponse>(`${this.baseUrl}/notas/mis-notas/${idDetalle}`);
  }

  create(data: NotaCreate): Observable<NotaResponse> {
    return this.http.post<NotaResponse>(`${this.baseUrl}/notas/`, data);
  }

  update(id: number, data: NotaUpdate): Observable<NotaResponse> {
    return this.http.patch<NotaResponse>(`${this.baseUrl}/notas/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notas/${id}`);
  }
}
