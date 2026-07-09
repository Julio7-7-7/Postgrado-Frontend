import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Alumno, AlumnoUpdate } from '../models/alumno.model';

@Injectable({ providedIn: 'root' })
export class AlumnoService extends ApiService {
  private readonly endpoint = 'alumnos';

  getMiPerfil(): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.baseUrl}/${this.endpoint}/mi-perfil`);
  }

  actualizarMiPerfil(data: AlumnoUpdate): Observable<Alumno> {
    return this.http.patch<Alumno>(`${this.baseUrl}/${this.endpoint}/mi-perfil`, data);
  }
}
