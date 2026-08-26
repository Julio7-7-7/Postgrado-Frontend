import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DetalleProgramaAlumno, AutoInscribirRequest, ControlDocumentacionAlumno } from '../models/detalle-programa-alumno.model';
import { Solicitud, SolicitudConDetalle, PuedeMigrarResponse } from '../models/solicitud-incorporacion.model';

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

  solicitar(data: {
    id_programa_version_edicion?: number | null;
    id_modalidad_academica?: number | null;
    id_tipo_descuento?: number | null;
    modulo_inicio?: number;
    url_documento?: string;
    motivo?: string;
  }): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.baseUrl}/solicitud/solicitar`, data);
  }

  subirDocumentoSolicitud(idSolicitud: number, idDoc: number, urlDocumento: string): Observable<Solicitud> {
    return this.http.patch<Solicitud>(
      `${this.baseUrl}/solicitud/${idSolicitud}/documentos/${idDoc}/subir`,
      { url_documento: urlDocumento }
    );
  }

  getMisSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.baseUrl}/solicitud/mis-solicitudes`);
  }

  puedeMigrar(idDpa: number): Observable<PuedeMigrarResponse> {
    return this.http.get<PuedeMigrarResponse>(
      `${this.baseUrl}/solicitud/puede-migrar`,
      { params: { id_detalle_programa_alumno: idDpa } }
    );
  }

  crearConUsuario(data: {
    email: string;
    ci: string;
    nombre: string;
    apellido: string;
    celular?: string;
    fecha_nacimiento?: string;
    genero?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/alumnos/crear-con-usuario`, data);
  }

  inscribirAdmin(data: {
    id_alumno: number;
    id_programa_version_edicion: number;
    id_modalidad_academica: number;
    id_tipo_descuento?: number | null;
    id_modulo_inicio?: number | null;
    motivo?: string;
  }): Observable<SolicitudConDetalle> {
    return this.http.post<SolicitudConDetalle>(`${this.baseUrl}/solicitud/crear-admin`, data);
  }
}
