import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  ModalidadAcademicaResponse, ModalidadAcademicaCreate, ModalidadAcademicaUpdate,
  RequisitoResponse, RequisitoCreate, RequisitoUpdate,
} from '../models/modalidad.model';

@Injectable({ providedIn: 'root' })
export class ModalidadService extends ApiService {
  getAll(): Observable<ModalidadAcademicaResponse[]> {
    return this.http.get<ModalidadAcademicaResponse[]>(`${this.baseUrl}/modalidades-academicas/`);
  }

  create(data: ModalidadAcademicaCreate): Observable<ModalidadAcademicaResponse> {
    return this.http.post<ModalidadAcademicaResponse>(`${this.baseUrl}/modalidades-academicas/`, data);
  }

  update(id: number, data: ModalidadAcademicaUpdate): Observable<ModalidadAcademicaResponse> {
    return this.http.patch<ModalidadAcademicaResponse>(`${this.baseUrl}/modalidades-academicas/${id}`, data);
  }

  getRequisitos(): Observable<RequisitoResponse[]> {
    return this.http.get<RequisitoResponse[]>(`${this.baseUrl}/requisitos/`);
  }

  createRequisito(data: RequisitoCreate): Observable<RequisitoResponse> {
    return this.http.post<RequisitoResponse>(`${this.baseUrl}/requisitos/`, data);
  }

  updateRequisito(id: number, data: RequisitoUpdate): Observable<RequisitoResponse> {
    return this.http.patch<RequisitoResponse>(`${this.baseUrl}/requisitos/${id}`, data);
  }

  deleteRequisito(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/requisitos/${id}`);
  }
}
