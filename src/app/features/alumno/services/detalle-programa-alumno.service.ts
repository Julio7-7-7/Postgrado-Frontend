import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DetalleProgramaAlumno, AutoInscribirRequest, ControlDocumentacionAlumno } from '../models/detalle-programa-alumno.model';

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
}
