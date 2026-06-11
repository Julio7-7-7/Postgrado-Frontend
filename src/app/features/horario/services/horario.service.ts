import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Horario, HorarioCreate, HorarioUpdate } from '../models/horario.model';

@Injectable({ providedIn: 'root' })
export class HorarioService extends ApiService {
  private readonly endpoint = 'horarios';

  getAll(detalle_id?: number): Observable<Horario[]> {
    let params = new HttpParams();
    if (detalle_id) {
      params = params.set('detalle_id', detalle_id);
    }
    return this.http.get<Horario[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: HorarioCreate): Observable<Horario> {
    return this.http.post<Horario>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: HorarioUpdate): Observable<Horario> {
    return this.http.patch<Horario>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }

  cancelar(id: number): Observable<Horario> {
    return this.http.patch<Horario>(`${this.baseUrl}/${this.endpoint}/${id}/cancelar`, {});
  }
}
