import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ModalidadAcademicaResponse, ModalidadAcademicaCreate, ModalidadAcademicaUpdate } from '../models/modalidad.model';

@Injectable({ providedIn: 'root' })
export class ModalidadService extends ApiService {
  getAll(): Observable<ModalidadAcademicaResponse[]> {
    return this.http.get<ModalidadAcademicaResponse[]>(`${this.baseUrl}/modalidades-academicas/`);
  }

  getById(id: number): Observable<ModalidadAcademicaResponse> {
    return this.http.get<ModalidadAcademicaResponse>(`${this.baseUrl}/modalidades-academicas/${id}`);
  }

  create(data: ModalidadAcademicaCreate): Observable<ModalidadAcademicaResponse> {
    return this.http.post<ModalidadAcademicaResponse>(`${this.baseUrl}/modalidades-academicas/`, data);
  }

  update(id: number, data: ModalidadAcademicaUpdate): Observable<ModalidadAcademicaResponse> {
    return this.http.patch<ModalidadAcademicaResponse>(`${this.baseUrl}/modalidades-academicas/${id}`, data);
  }

  cambiarEstado(id: number): Observable<ModalidadAcademicaResponse> {
    return this.http.patch<ModalidadAcademicaResponse>(`${this.baseUrl}/modalidades-academicas/${id}/cambiar-estado`, {});
  }
}
