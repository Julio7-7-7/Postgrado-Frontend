import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DetalleProgramaAlumno, AutoInscribirRequest, ControlDocumentacionAlumno } from '../models/detalle-programa-alumno.model';
import { SolicitudIncorporacion, SolicitudReincorporacion, SolicitudReincorporacionDocumento } from '../models/solicitud-incorporacion.model';

@Injectable({ providedIn: 'root' })
export class DetalleProgramaAlumnoService extends ApiService {
  private readonly endpoint = 'detalle-programa-alumno';

  getMisInscripciones(): Observable<DetalleProgramaAlumno[]> {
    return this.http.get<DetalleProgramaAlumno[]>(`${this.baseUrl}/${this.endpoint}/mis-inscripciones`);
  }

  getMiInscripcion(id: number): Observable<DetalleProgramaAlumno> {
    return this.http.get<DetalleProgramaAlumno>(`${this.baseUrl}/${this.endpoint}/mi-inscripcion/${id}`);
  }

  autoInscribir(data: AutoInscribirRequest): Observable<DetalleProgramaAlumno> {
    return this.http.post<DetalleProgramaAlumno>(`${this.baseUrl}/${this.endpoint}/auto-inscribir`, data);
  }

  retirar(id: number): Observable<DetalleProgramaAlumno> {
    return this.http.patch<DetalleProgramaAlumno>(`${this.baseUrl}/${this.endpoint}/${id}/retirar`, {});
  }

  subirDocumento(idControl: number, urlDocumento: string): Observable<ControlDocumentacionAlumno> {
    return this.http.post<ControlDocumentacionAlumno>(
      `${this.baseUrl}/control-documentacion/${idControl}/subir-documento`,
      { url_documento: urlDocumento }
    );
  }

  solicitarIncorporacion(data: {
    id_programa_version_edicion?: number | null;
    id_modalidad_academica?: number | null;
    id_tipo_descuento?: number | null;
    modulo_inicio?: number;
    url_documento?: string;
    id_requisito?: number | null;
  }): Observable<SolicitudIncorporacion> {
    return this.http.post<SolicitudIncorporacion>(
      `${this.baseUrl}/solicitud-incorporacion/solicitar`,
      data
    );
  }

  subirDocumentoSolicitud(idSolicitud: number, idDoc: number, urlDocumento: string): Observable<SolicitudIncorporacion> {
    return this.http.patch<SolicitudIncorporacion>(
      `${this.baseUrl}/solicitud-incorporacion/${idSolicitud}/documentos/${idDoc}/subir`,
      { url_documento: urlDocumento }
    );
  }

  getMisSolicitudes(): Observable<SolicitudIncorporacion[]> {
    return this.http.get<SolicitudIncorporacion[]>(`${this.baseUrl}/solicitud-incorporacion/mis-solicitudes`);
  }

  solicitarReincorporacion(idDpa: number, motivo?: string): Observable<SolicitudReincorporacion> {
    return this.http.post<SolicitudReincorporacion>(
      `${this.baseUrl}/solicitud-reincorporacion/solicitar/${idDpa}`,
      { motivo: motivo || '' }
    );
  }

  getMisSolicitudesReincorporacion(): Observable<SolicitudReincorporacion[]> {
    return this.http.get<SolicitudReincorporacion[]>(`${this.baseUrl}/solicitud-reincorporacion/mis-solicitudes`);
  }

  subirDocumentoReincorporacion(idSolicitud: number, idDoc: number, urlDocumento: string): Observable<{ ok: boolean; url: string }> {
    return this.http.post<{ ok: boolean; url: string }>(
      `${this.baseUrl}/solicitud-reincorporacion/${idSolicitud}/documentos/${idDoc}/subir`,
      { url_documento: urlDocumento }
    );
  }
}
