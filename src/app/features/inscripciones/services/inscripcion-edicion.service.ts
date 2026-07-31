import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PaginatedInscripciones, TranscriptResponse, EdicionBasica } from '../models/inscripcion-edicion.model';
import { DetalleProgramaAlumno } from '../../alumno/models/detalle-programa-alumno.model';
import { SolicitudConDetalle, PreviewMigracion } from '../../alumno/models/solicitud-incorporacion.model';

@Injectable({ providedIn: 'root' })
export class InscripcionEdicionService extends ApiService {

  getPorEdicion(idEdicion: number, page = 1, perPage = 20, estado?: string, search?: string): Observable<PaginatedInscripciones> {
    let url = `${this.baseUrl}/detalle-programa-alumno/por-edicion/${idEdicion}?page=${page}&per_page=${perPage}`;
    if (estado) url += `&estado=${estado}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<PaginatedInscripciones>(url);
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

  getSolicitudes(tipo?: string, estado?: string): Observable<SolicitudConDetalle[]> {
    let url = `${this.baseUrl}/solicitud/`;
    const params: string[] = [];
    if (tipo) params.push(`tipo=${tipo}`);
    if (estado) params.push(`estado=${estado}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get<SolicitudConDetalle[]>(url);
  }

  getSolicitudesIncorporacion(estado?: string): Observable<SolicitudConDetalle[]> {
    return this.getSolicitudes('incorporacion', estado);
  }

  aprobarSolicitud(idSolicitud: number, data?: { id_programa_version_edicion?: number; id_tipo_descuento?: number; id_modulo_inicio?: number | null; motivo?: string }): Observable<SolicitudConDetalle> {
    return this.http.patch<SolicitudConDetalle>(
      `${this.baseUrl}/solicitud/${idSolicitud}/aprobar`, data || null
    );
  }

  rechazarSolicitud(idSolicitud: number, motivoRechazo: string = ''): Observable<SolicitudConDetalle> {
    return this.http.patch<SolicitudConDetalle>(
      `${this.baseUrl}/solicitud/${idSolicitud}/rechazar`, motivoRechazo
    );
  }

  previewMigracion(idSolicitud: number, idEdicion: number): Observable<PreviewMigracion> {
    return this.http.get<PreviewMigracion>(
      `${this.baseUrl}/solicitud/${idSolicitud}/preview-migracion?id_programa_version_edicion=${idEdicion}`
    );
  }

  getPendientesCount(tipo?: string): Observable<{ count: number }> {
    let url = `${this.baseUrl}/solicitud/pendientes-count`;
    if (tipo) url += `?tipo=${tipo}`;
    return this.http.get<{ count: number }>(url);
  }
}
