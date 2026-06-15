import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DetalleProgramaModulo, DetalleUpdate } from '../models/detalle.model';

@Injectable({ providedIn: 'root' })
export class DetalleService extends ApiService {
  private readonly endpoint = 'detalle-programa-modulo';

  getAll(edicion_id?: number): Observable<DetalleProgramaModulo[]> {
    let params = new HttpParams();
    if (edicion_id) {
      params = params.set('edicion_id', edicion_id);
    }
    return this.http.get<DetalleProgramaModulo[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<DetalleProgramaModulo> {
    return this.http.get<DetalleProgramaModulo>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  update(id: number, data: DetalleUpdate): Observable<DetalleProgramaModulo> {
    return this.http.patch<DetalleProgramaModulo>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }

}
