import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Alumno } from '../models/alumno.model';

@Injectable({ providedIn: 'root' })
export class AlumnoService extends ApiService {
  private readonly endpoint = 'alumnos';

  getAll(): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(`${this.baseUrl}/${this.endpoint}/`);
  }

  getMiPerfil(): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.baseUrl}/${this.endpoint}/mi-perfil`);
  }
}
