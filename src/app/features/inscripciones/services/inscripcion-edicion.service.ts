import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PaginatedInscripciones, TransferirRequest, TranscriptResponse, EdicionBasica } from '../models/inscripcion-edicion.model';
import { DetalleProgramaAlumno } from '../../alumno/models/detalle-programa-alumno.model';
import { SolicitudIncorporacionConDetalle, PreviewMigracion } from '../../alumno/models/solicitud-incorporacion.model';

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
    return this.http.get<TranscriptResponse>(`${this.baseUrl}/notas/transcript/${idAlumno}`);
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

  getSolicitudesIncorporacion(estado?: string): Observable<SolicitudIncorporacionConDetalle[]> {
    let url = `${this.baseUrl}/solicitud-incorporacion/`;
    if (estado) url += `?estado=${estado}`;
    return this.http.get<SolicitudIncorporacionConDetalle[]>(url);
  }

  aprobarSolicitud(idSolicitud: number, data?: { id_programa_version_edicion?: number; id_modalidad_academica?: number; id_tipo_descuento?: number; modulo_inicio?: number; motivo?: string }): Observable<SolicitudIncorporacionConDetalle> {
    return this.http.patch<SolicitudIncorporacionConDetalle>(
      `${this.baseUrl}/solicitud-incorporacion/${idSolicitud}/aprobar`, data || null
    );
  }

  rechazarSolicitud(idSolicitud: number, observaciones: string): Observable<SolicitudIncorporacionConDetalle> {
    return this.http.patch<SolicitudIncorporacionConDetalle>(
      `${this.baseUrl}/solicitud-incorporacion/${idSolicitud}/rechazar?observaciones=${encodeURIComponent(observaciones)}`, null
    );
  }

  previewMigracion(idSolicitud: number, idEdicion: number, idModalidad: number): Observable<PreviewMigracion> {
    return this.http.get<PreviewMigracion>(
      `${this.baseUrl}/solicitud-incorporacion/${idSolicitud}/preview-migracion?id_programa_version_edicion=${idEdicion}&id_modalidad_academica=${idModalidad}`
    );
  }
}
