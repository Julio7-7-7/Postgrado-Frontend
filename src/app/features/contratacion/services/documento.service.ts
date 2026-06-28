import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DocumentoContratacion, DocumentoCreate } from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoService extends ApiService {
  private readonly endpoint = 'documentos-contratacion';

  getAll(contratacionId?: number): Observable<DocumentoContratacion[]> {
    let params = new HttpParams();
    if (contratacionId) params = params.set('contratacion_id', contratacionId);
    return this.http.get<DocumentoContratacion[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<DocumentoContratacion> {
    return this.http.get<DocumentoContratacion>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: DocumentoCreate): Observable<DocumentoContratacion> {
    return this.http.post<DocumentoContratacion>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  cancelar(id: number): Observable<DocumentoContratacion> {
    return this.http.patch<DocumentoContratacion>(`${this.baseUrl}/${this.endpoint}/${id}/cancelar`, {});
  }
}
