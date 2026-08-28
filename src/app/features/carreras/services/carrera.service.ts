import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Carrera, CarreraCreate, CarreraUpdate } from '../models/carrera.model';

@Injectable({ providedIn: 'root' })
export class CarreraService extends ApiService {
  private readonly endpoint = 'carreras';

  getAll(soloActivas = false): Observable<Carrera[]> {
    const params = soloActivas ? { solo_activas: 'true' } : undefined;
    return this.http.get<Carrera[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<Carrera> {
    return this.http.get<Carrera>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: CarreraCreate): Observable<Carrera> {
    return this.http.post<Carrera>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: CarreraUpdate): Observable<Carrera> {
    return this.http.patch<Carrera>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }

  cambiarEstado(id: number): Observable<Carrera> {
    return this.http.patch<Carrera>(`${this.baseUrl}/${this.endpoint}/${id}/cambiar-estado`, {});
  }
}