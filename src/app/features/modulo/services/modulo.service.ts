import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Modulo, ModuloCreate } from '../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModuloService extends ApiService {
  private readonly endpoint = 'modulos';

  getAll(programa_version_id?: number): Observable<Modulo[]> {
    let params = new HttpParams();
    if (programa_version_id) {
      params = params.set('programa_version_id', programa_version_id);
    }
    return this.http.get<Modulo[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
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
