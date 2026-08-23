import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { EtapaContratacion, EtapaContratacionCreate, EtapaRequisitoAsignar } from '../models/etapa.model';

@Injectable({ providedIn: 'root' })
export class EtapaService extends ApiService {
  private readonly endpoint = 'etapas-contratacion';

  getAll(tipoProgramaId?: number): Observable<EtapaContratacion[]> {
    let params = new HttpParams();
    if (tipoProgramaId) params = params.set('tipo_programa_id', tipoProgramaId);
    return this.http.get<EtapaContratacion[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<EtapaContratacion> {
    return this.http.get<EtapaContratacion>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: EtapaContratacionCreate): Observable<EtapaContratacion> {
    return this.http.post<EtapaContratacion>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<EtapaContratacionCreate>): Observable<EtapaContratacion> {
    return this.http.patch<EtapaContratacion>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }

  updateRequisitos(id: number, requisitos: EtapaRequisitoAsignar[]): Observable<EtapaContratacion> {
    return this.http.patch<EtapaContratacion>(`${this.baseUrl}/${this.endpoint}/${id}/requisitos`, requisitos);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }
}
