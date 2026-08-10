import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  MisPagosResponse, PagosEdicionData, PreviewResponse, TransaccionPagoBaja,
  TransaccionPagoCreate, TransaccionPagoResponse, TranscriptPagosResponse,
} from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagoService extends ApiService {

  getPagosPorEdicion(idEdicion: number): Observable<PagosEdicionData> {
    return this.http.get<PagosEdicionData>(`${this.baseUrl}/pagos/por-edicion/${idEdicion}`);
  }

  getMisPagos(idDetalle: number): Observable<MisPagosResponse> {
    return this.http.get<MisPagosResponse>(`${this.baseUrl}/pagos/mis-pagos/${idDetalle}`);
  }

  getTranscriptPagos(idAlumno: number): Observable<TranscriptPagosResponse> {
    return this.http.get<TranscriptPagosResponse>(`${this.baseUrl}/pagos/transcript/${idAlumno}`);
  }

  preview(data: TransaccionPagoCreate): Observable<PreviewResponse> {
    return this.http.post<PreviewResponse>(`${this.baseUrl}/pagos/preview`, data);
  }

  create(data: TransaccionPagoCreate): Observable<TransaccionPagoResponse> {
    return this.http.post<TransaccionPagoResponse>(`${this.baseUrl}/pagos/`, data);
  }

  anular(idTransaccion: number, data: TransaccionPagoBaja): Observable<TransaccionPagoResponse> {
    return this.http.patch<TransaccionPagoResponse>(`${this.baseUrl}/pagos/transacciones/${idTransaccion}/anular`, data);
  }
}
