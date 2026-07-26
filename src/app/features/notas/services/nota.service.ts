import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AlumnoNotas, NotaCreate, NotaUpdate, NotaResponse,
  DocenteEdicionCompleta, DocenteModuloDetalle, HistorialTransferenciasResponse,
} from '../models/nota.model';
import { ProgramaVersionEdicionResponse } from '../../documentacion/models/documentacion.model';

@Injectable({ providedIn: 'root' })
export class NotaService extends ApiService {

  getEdiciones(): Observable<ProgramaVersionEdicionResponse[]> {
    return this.http.get<ProgramaVersionEdicionResponse[]>(`${this.baseUrl}/programa-version-edicion/`);
  }

  getNotasPorEdicion(idEdicion: number): Observable<AlumnoNotas[]> {
    return this.http.get<AlumnoNotas[]>(`${this.baseUrl}/notas/por-edicion/${idEdicion}`);
  }

  getNotasPorDocente(idDocente: number): Observable<DocenteEdicionCompleta[]> {
    return this.http.get<DocenteEdicionCompleta[]>(`${this.baseUrl}/notas/por-docente/${idDocente}`);
  }

  getNotasPorModulo(idDpm: number): Observable<DocenteModuloDetalle> {
    return this.http.get<DocenteModuloDetalle>(`${this.baseUrl}/notas/por-modulo/${idDpm}`);
  }

  create(data: NotaCreate): Observable<NotaResponse> {
    return this.http.post<NotaResponse>(`${this.baseUrl}/notas/`, data);
  }

  update(id: number, data: NotaUpdate): Observable<NotaResponse> {
    return this.http.patch<NotaResponse>(`${this.baseUrl}/notas/${id}`, data);
  }

  getHistorialTransferencias(idAlumno: number): Observable<HistorialTransferenciasResponse> {
    return this.http.get<HistorialTransferenciasResponse>(`${this.baseUrl}/detalle-programa-alumno/historial-transferencias/${idAlumno}`);
  }
}
