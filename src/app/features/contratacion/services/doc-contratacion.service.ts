import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ControlDocContratacion } from '../models/etapa.model';

@Injectable({ providedIn: 'root' })
export class DocContratacionService extends ApiService {
  private readonly endpoint = 'doc-contratacion';

  getAll(contratacionId?: number, etapaId?: number): Observable<ControlDocContratacion[]> {
    let params = new HttpParams();
    if (contratacionId) params = params.set('contratacion_id', contratacionId);
    if (etapaId) params = params.set('etapa_id', etapaId);
    return this.http.get<ControlDocContratacion[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<ControlDocContratacion> {
    return this.http.get<ControlDocContratacion>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  inicializar(contratacionId: number): Observable<ControlDocContratacion[]> {
    return this.http.post<ControlDocContratacion[]>(
      `${this.baseUrl}/${this.endpoint}/inicializar/${contratacionId}`,
      {},
    );
  }

  subirDocumento(id: number, file: File): Observable<ControlDocContratacion> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<ControlDocContratacion>(
      `${this.baseUrl}/${this.endpoint}/${id}/subir`,
      formData,
    );
  }

  actualizarEstado(id: number, data: { estado?: string; notas?: string }): Observable<ControlDocContratacion> {
    return this.http.patch<ControlDocContratacion>(
      `${this.baseUrl}/${this.endpoint}/${id}`,
      data,
    );
  }

  avanzarEtapa(contratacionId: number): Observable<ControlDocContratacion[]> {
    return this.http.post<ControlDocContratacion[]>(
      `${this.baseUrl}/${this.endpoint}/${contratacionId}/avanzar-etapa`,
      {},
    );
  }

  urlPdf(ruta: string | null): string {
    if (!ruta) return '';
    return `${this.baseUrl}${ruta}`;
  }
}
