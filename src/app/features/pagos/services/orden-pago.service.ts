import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  OrdenPagoBaja, OrdenPagoEmitir, OrdenPagoPagar, OrdenPagoPreview, OrdenPagoResponse,
} from '../models/orden-pago.model';
import { TransaccionPagoResponse } from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class OrdenPagoService extends ApiService {

  preview(data: OrdenPagoEmitir): Observable<OrdenPagoPreview> {
    return this.http.post<OrdenPagoPreview>(`${this.baseUrl}/ordenes-pago/preview`, data);
  }

  emitir(data: OrdenPagoEmitir): Observable<OrdenPagoResponse> {
    return this.http.post<OrdenPagoResponse>(`${this.baseUrl}/ordenes-pago/`, data);
  }

  getOrden(id: number): Observable<OrdenPagoResponse> {
    return this.http.get<OrdenPagoResponse>(`${this.baseUrl}/ordenes-pago/${id}`);
  }

  getOrdenesDeAlumno(idDpa: number): Observable<OrdenPagoResponse[]> {
    return this.http.get<OrdenPagoResponse[]>(`${this.baseUrl}/ordenes-pago/dpa/${idDpa}`);
  }

  pagar(id: number, data: OrdenPagoPagar): Observable<TransaccionPagoResponse> {
    return this.http.post<TransaccionPagoResponse>(`${this.baseUrl}/ordenes-pago/${id}/pagar`, data);
  }

  anular(id: number, data: OrdenPagoBaja): Observable<OrdenPagoResponse> {
    return this.http.patch<OrdenPagoResponse>(`${this.baseUrl}/ordenes-pago/${id}/anular`, data);
  }
}
