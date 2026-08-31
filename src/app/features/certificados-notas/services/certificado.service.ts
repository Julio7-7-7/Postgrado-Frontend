import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  CertificadoNotas,
  CertificadoElegibleAlumno,
  CertificadoEmitirRequest,
  CertificadoEmitirResponse,
  CertificadoImpresionResponse,
} from '../models/certificado.model';

@Injectable({ providedIn: 'root' })
export class CertificadoService extends ApiService {
  private readonly endpoint = 'certificados-notas';

  porEdicion(idEdicion: number): Observable<CertificadoNotas[]> {
    return this.http.get<CertificadoNotas[]>(`${this.baseUrl}/${this.endpoint}/por-edicion/${idEdicion}`);
  }

  elegibles(idEdicion: number): Observable<{ id_programa_version_edicion: number; alumnos: CertificadoElegibleAlumno[] }> {
    return this.http.get<{ id_programa_version_edicion: number; alumnos: CertificadoElegibleAlumno[] }>(
      `${this.baseUrl}/${this.endpoint}/elegibles/${idEdicion}`,
    );
  }

  emitir(data: CertificadoEmitirRequest): Observable<CertificadoEmitirResponse> {
    return this.http.post<CertificadoEmitirResponse>(`${this.baseUrl}/${this.endpoint}/emitir`, data);
  }

  obtener(idCertificado: number): Observable<CertificadoNotas> {
    return this.http.get<CertificadoNotas>(`${this.baseUrl}/${this.endpoint}/${idCertificado}`);
  }

  imprimir(idCertificado: number): Observable<CertificadoImpresionResponse> {
    return this.http.post<CertificadoImpresionResponse>(
      `${this.baseUrl}/${this.endpoint}/${idCertificado}/imprimir`,
      {},
    );
  }
}