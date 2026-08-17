import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InformeNotas, ElegiblesResponse } from '../models/informe-notas.model';

export interface CertificadoNotas {
  id_certificado: number;
  id_alumno: number;
  id_programa_version_edicion: number;
  id_informe: number;
  fecha_emision: string;
  ruta_pdf: string | null;
  informe: {
    numero_tanda: number;
    fecha_emision: string;
  };
}

@Injectable({ providedIn: 'root' })
export class InformeNotasService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/informes-notas`;
  private certApi = `${environment.apiUrl}/certificados-notas`;

  getElegibles(idEdicion: number): Observable<ElegiblesResponse> {
    return this.http.get<ElegiblesResponse>(`${this.api}/elegibles/${idEdicion}`);
  }

  getPorEdicion(idEdicion: number): Observable<InformeNotas[]> {
    return this.http.get<InformeNotas[]>(`${this.api}/por-edicion/${idEdicion}`);
  }

  crear(data: {
    id_programa_version_edicion: number;
    numero_tanda: number;
    alumnos_ids: number[];
    observaciones?: string;
  }): Observable<InformeNotas> {
    return this.http.post<InformeNotas>(this.api, data);
  }

  enviar(idInforme: number): Observable<InformeNotas> {
    return this.http.patch<InformeNotas>(`${this.api}/${idInforme}/enviar`, {});
  }

  getMisCertificados(idAlumno: number): Observable<CertificadoNotas[]> {
    return this.http.get<CertificadoNotas[]>(`${this.certApi}/mis-certificados/${idAlumno}`);
  }
}
