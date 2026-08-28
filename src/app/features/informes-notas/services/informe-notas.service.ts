import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  InformeNotasRequest, InformePreviewResponse, InformeNotas,
  ElegiblesResponse, CertificadosPorInformeResponse,
} from '../models/informe-notas.model';

@Injectable({ providedIn: 'root' })
export class InformeNotasService extends ApiService {
  private readonly endpoint = 'informes-notas';

  preview(data: InformeNotasRequest): Observable<InformePreviewResponse> {
    return this.http.post<InformePreviewResponse>(`${this.baseUrl}/${this.endpoint}/preview`, data);
  }

  generar(data: InformeNotasRequest): Observable<InformeNotas> {
    return this.http.post<InformeNotas>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  porEdicion(idEdicion: number): Observable<InformeNotas[]> {
    return this.http.get<InformeNotas[]>(`${this.baseUrl}/${this.endpoint}/por-edicion/${idEdicion}`);
  }

  getInforme(idInforme: number): Observable<InformeNotas> {
    return this.http.get<InformeNotas>(`${this.baseUrl}/${this.endpoint}/${idInforme}`);
  }

  getElegibles(idEdicion: number): Observable<ElegiblesResponse> {
    return this.http.get<ElegiblesResponse>(`${this.baseUrl}/${this.endpoint}/elegibles/${idEdicion}`);
  }

  getCertificadosPorInforme(idInforme: number): Observable<CertificadosPorInformeResponse> {
    return this.http.get<CertificadosPorInformeResponse>(
      `${this.baseUrl}/certificados-notas/por-informe/${idInforme}`,
    );
  }
}