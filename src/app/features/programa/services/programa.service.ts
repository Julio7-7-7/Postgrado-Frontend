import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Programa, ProgramaCreate } from '../models/programa.model';

@Injectable({ providedIn: 'root' })
export class ProgramaService extends ApiService {
  private readonly endpoint = 'programas';

  getAll(): Observable<Programa[]> {
    return this.http.get<Programa[]>(`${this.baseUrl}/${this.endpoint}/`);
  }

  getById(id: number): Observable<Programa> {
    return this.http.get<Programa>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: ProgramaCreate): Observable<Programa> {
    return this.http.post<Programa>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<ProgramaCreate>): Observable<Programa> {
    return this.http.patch<Programa>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }
}
