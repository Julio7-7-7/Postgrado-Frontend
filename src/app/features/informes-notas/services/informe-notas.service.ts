import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  InformeNotasRequest, InformeNotas,
  CertificadosPorInformeResponse,
} from '../models/informe-notas.model';

@Injectable({ providedIn: 'root' })
export class InformeNotasService extends ApiService {
  private readonly endpoint = 'informes-notas';

  generar(data: InformeNotasRequest): Observable<InformeNotas> {
    return this.http.post<InformeNotas>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  porEdicion(idEdicion: number): Observable<InformeNotas[]> {
    return this.http.get<InformeNotas[]>(`${this.baseUrl}/${this.endpoint}/por-edicion/${idEdicion}`);
  }

  getInforme(idInforme: number): Observable<InformeNotas> {
    return this.http.get<InformeNotas>(`${this.baseUrl}/${this.endpoint}/${idInforme}`);
  }

  getCertificadosPorInforme(idInforme: number): Observable<CertificadosPorInformeResponse> {
    return this.http.get<CertificadosPorInformeResponse>(
      `${this.baseUrl}/certificados-notas/por-informe/${idInforme}`,
    );
  }
}