import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AlumnoNotas, NotaCreate, NotaUpdate, NotaResponse, MisNotasResponse,
  DocenteEdicionCompleta, DocenteModuloDetalle, HistorialTransferenciasResponse,
} from '../models/nota.model';

@Injectable({ providedIn: 'root' })
export class NotaService extends ApiService {

  getNotasPorEdicion(idEdicion: number): Observable<AlumnoNotas[]> {
    return this.http.get<AlumnoNotas[]>(`${this.baseUrl}/notas/por-edicion/${idEdicion}`);
  }

  getNotasPorDocente(idDocente: number): Observable<DocenteEdicionCompleta[]> {
    return this.http.get<DocenteEdicionCompleta[]>(`${this.baseUrl}/notas/por-docente/${idDocente}`);
  }

  getNotasPorModulo(idDpm: number): Observable<DocenteModuloDetalle> {
    return this.http.get<DocenteModuloDetalle>(`${this.baseUrl}/notas/por-modulo/${idDpm}`);
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

  getHistorialTransferencias(idAlumno: number): Observable<HistorialTransferenciasResponse> {
    return this.http.get<HistorialTransferenciasResponse>(`${this.baseUrl}/detalle-programa-alumno/historial-transferencias/${idAlumno}`);
  }
}
