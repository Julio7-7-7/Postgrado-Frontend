import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ContratacionDocente, ContratacionCreate } from '../models/contratacion.model';

@Injectable({ providedIn: 'root' })
export class ContratacionService extends ApiService {
  private readonly endpoint = 'contratacion-docente';

  getAll(docenteId?: number, detalleId?: number, estado?: string): Observable<ContratacionDocente[]> {
    let params = new HttpParams();
    if (docenteId) params = params.set('docente_id', docenteId);
    if (detalleId) params = params.set('detalle_id', detalleId);
    if (estado) params = params.set('estado', estado);
    return this.http.get<ContratacionDocente[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<ContratacionDocente> {
    return this.http.get<ContratacionDocente>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: ContratacionCreate): Observable<ContratacionDocente> {
    return this.http.post<ContratacionDocente>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<ContratacionCreate>): Observable<ContratacionDocente> {
    return this.http.patch<ContratacionDocente>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }

  truncar(id: number): Observable<ContratacionDocente> {
    return this.http.patch<ContratacionDocente>(`${this.baseUrl}/${this.endpoint}/${id}/truncar`, {});
  }
}
