import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Modulo, ModuloCreate } from '../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModuloService extends ApiService {
  private readonly endpoint = 'modulos';

  getAll(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.baseUrl}/${this.endpoint}/`);
  }

  getById(id: number): Observable<Modulo> {
    return this.http.get<Modulo>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: ModuloCreate): Observable<Modulo> {
    return this.http.post<Modulo>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<ModuloCreate>): Observable<Modulo> {
    return this.http.patch<Modulo>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }
}
