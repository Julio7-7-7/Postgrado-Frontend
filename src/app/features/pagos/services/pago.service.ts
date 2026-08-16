import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  BusquedaPagosResponse, MisPagosResponse, PagosEdicionData, TransaccionPagoBaja,
  TransaccionPagoResponse, TranscriptPagosResponse,
} from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagoService extends ApiService {

  getPagosPorEdicion(idEdicion: number): Observable<PagosEdicionData> {
    return this.http.get<PagosEdicionData>(`${this.baseUrl}/pagos/por-edicion/${idEdicion}`);
  }

  buscarAlumnos(q: string): Observable<BusquedaPagosResponse> {
    return this.http.get<BusquedaPagosResponse>(`${this.baseUrl}/pagos/buscar`, { params: { q } });
  }

  getMisPagos(idDetalle: number): Observable<MisPagosResponse> {
    return this.http.get<MisPagosResponse>(`${this.baseUrl}/pagos/mis-pagos/${idDetalle}`);
  }

  getTranscriptPagos(idAlumno: number): Observable<TranscriptPagosResponse> {
    return this.http.get<TranscriptPagosResponse>(`${this.baseUrl}/pagos/transcript/${idAlumno}`);
  }

  anular(idTransaccion: number, data: TransaccionPagoBaja): Observable<TransaccionPagoResponse> {
    return this.http.patch<TransaccionPagoResponse>(`${this.baseUrl}/pagos/transacciones/${idTransaccion}/anular`, data);
  }
}
