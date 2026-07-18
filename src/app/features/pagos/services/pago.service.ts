import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AlumnoPagos, PagoCreate, PagoUpdate, PagoResponse, MisPagosResponse,
} from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagoService extends ApiService {

  getPagosPorEdicion(idEdicion: number): Observable<AlumnoPagos[]> {
    return this.http.get<AlumnoPagos[]>(`${this.baseUrl}/pagos/por-edicion/${idEdicion}`);
  }

  getMisPagos(idDetalle: number): Observable<MisPagosResponse> {
    return this.http.get<MisPagosResponse>(`${this.baseUrl}/pagos/mis-pagos/${idDetalle}`);
  }

  create(data: PagoCreate): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.baseUrl}/pagos/`, data);
  }

  update(id: number, data: PagoUpdate): Observable<PagoResponse> {
    return this.http.patch<PagoResponse>(`${this.baseUrl}/pagos/${id}`, data);
  }
}
