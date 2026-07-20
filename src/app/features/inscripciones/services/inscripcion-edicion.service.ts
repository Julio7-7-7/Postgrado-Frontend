import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PaginatedInscripciones, TransferirRequest, TranscriptResponse, EdicionBasica } from '../models/inscripcion-edicion.model';
import { DetalleProgramaAlumno } from '../../alumno/models/detalle-programa-alumno.model';

@Injectable({ providedIn: 'root' })
export class InscripcionEdicionService extends ApiService {

  getPorEdicion(idEdicion: number, page = 1, perPage = 20, estado?: string, search?: string): Observable<PaginatedInscripciones> {
    let url = `${this.baseUrl}/detalle-programa-alumno/por-edicion/${idEdicion}?page=${page}&per_page=${perPage}`;
    if (estado) url += `&estado=${estado}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<PaginatedInscripciones>(url);
  }

  transferir(idDetalle: number, data: TransferirRequest): Observable<DetalleProgramaAlumno> {
    return this.http.post<DetalleProgramaAlumno>(
      `${this.baseUrl}/detalle-programa-alumno/${idDetalle}/transferir`, data
    );
  }

  getTranscript(idAlumno: number): Observable<TranscriptResponse> {
    return this.http.get<TranscriptResponse>(`${this.baseUrl}/avance-modulo/transcript/${idAlumno}`);
  }

  getEdicionesDisponibles(): Observable<EdicionBasica[]> {
    return this.http.get<any[]>(`${this.baseUrl}/programa-version-edicion/?activas=true`).pipe(
      map(ediciones => ediciones.map(e => ({
        id_programa_version_edicion: e.id_programa_version_edicion,
        edicion: e.edicion,
        anio: e.anio,
        semestre: e.semestre,
        estado: e.estado,
        programa_nombre: e.programa_version?.programa?.nombre_programa ?? 'N/A',
      }))),
    );
  }

  getDetalle(idDetalle: number): Observable<DetalleProgramaAlumno> {
    return this.http.get<DetalleProgramaAlumno>(`${this.baseUrl}/detalle-programa-alumno/${idDetalle}`);
  }
}
