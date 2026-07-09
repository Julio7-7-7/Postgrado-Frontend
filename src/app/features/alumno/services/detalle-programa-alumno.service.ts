import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DetalleProgramaAlumno, AutoInscribirRequest } from '../models/detalle-programa-alumno.model';

@Injectable({ providedIn: 'root' })
export class DetalleProgramaAlumnoService extends ApiService {
  private readonly endpoint = 'detalle-programa-alumno';

  getMisInscripciones(): Observable<DetalleProgramaAlumno[]> {
    return this.http.get<DetalleProgramaAlumno[]>(`${this.baseUrl}/${this.endpoint}/mis-inscripciones`);
  }

  autoInscribir(data: AutoInscribirRequest): Observable<DetalleProgramaAlumno> {
    return this.http.post<DetalleProgramaAlumno>(`${this.baseUrl}/${this.endpoint}/auto-inscribir`, data);
  }
}
