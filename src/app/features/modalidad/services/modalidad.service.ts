import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Modalidad } from '../models/modalidad.model';

@Injectable({ providedIn: 'root' })
export class ModalidadService extends ApiService {
  private readonly endpoint = 'modalidades';

  getAll(): Observable<Modalidad[]> {
    return this.http.get<Modalidad[]>(`${this.baseUrl}/${this.endpoint}/`);
  }

  getById(id: number): Observable<Modalidad> {
    return this.http.get<Modalidad>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }
}
