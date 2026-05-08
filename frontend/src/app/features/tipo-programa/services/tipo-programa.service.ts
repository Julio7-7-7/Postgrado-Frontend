import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { TipoPrograma, TipoProgramaCreate } from '../models/tipo-programa.model';

@Injectable({ providedIn: 'root' })
export class TipoProgramaService extends ApiService {

  private endpoint = `${this.baseUrl}/tipos-programa`;

  getAll(): Observable<TipoPrograma[]> {
    return this.http.get<TipoPrograma[]>(this.endpoint);
  }

  getById(id: number): Observable<TipoPrograma> {
    return this.http.get<TipoPrograma>(`${this.endpoint}/${id}`);
  }

  create(data: TipoProgramaCreate): Observable<TipoPrograma> {
    return this.http.post<TipoPrograma>(`${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<TipoProgramaCreate>): Observable<TipoPrograma> {
    return this.http.patch<TipoPrograma>(`${this.endpoint}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}