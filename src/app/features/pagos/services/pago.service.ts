import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  PagoCreate, PagoUpdate, PagoResponse, MisPagosResponse, PagosEdicionData,
} from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagoService extends ApiService {

  getPagosPorEdicion(idEdicion: number): Observable<PagosEdicionData> {
    return this.http.get<PagosEdicionData>(`${this.baseUrl}/pagos/por-edicion/${idEdicion}`);
  }

  getMisPagos(idDetalle: number): Observable<MisPagosResponse> {
    return this.http.get<MisPagosResponse>(`${this.baseUrl}/pagos/mis-pagos/${idDetalle}`);
  }

  create(data: PagoCreate): Observable<{ pagos: PagoResponse[] }> {
    return this.http.post<{ pagos: PagoResponse[] }>(`${this.baseUrl}/pagos/`, data);
  }

  update(id: number, data: PagoUpdate): Observable<PagoResponse> {
    return this.http.patch<PagoResponse>(`${this.baseUrl}/pagos/${id}`, data);
  }
}
