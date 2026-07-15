import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { TipoDescuentoResponse, TipoDescuentoCreate, TipoDescuentoUpdate } from '../models/tipo-descuento.model';
import { ModalidadAcademicaResponse } from '../../modalidad/models/modalidad.model';
import { RequisitoResponse } from '../../modalidad/models/modalidad.model';

@Injectable({ providedIn: 'root' })
export class TipoDescuentoService extends ApiService {
  getAll(): Observable<TipoDescuentoResponse[]> {
    return this.http.get<TipoDescuentoResponse[]>(`${this.baseUrl}/tipos-descuento/`);
  }

  create(data: TipoDescuentoCreate): Observable<TipoDescuentoResponse> {
    return this.http.post<TipoDescuentoResponse>(`${this.baseUrl}/tipos-descuento/`, data);
  }

  update(id: number, data: TipoDescuentoUpdate): Observable<TipoDescuentoResponse> {
    return this.http.patch<TipoDescuentoResponse>(`${this.baseUrl}/tipos-descuento/${id}`, data);
  }

  getModalidades(): Observable<ModalidadAcademicaResponse[]> {
    return this.http.get<ModalidadAcademicaResponse[]>(`${this.baseUrl}/modalidades-academicas/`);
  }

  getRequisitos(): Observable<RequisitoResponse[]> {
    return this.http.get<RequisitoResponse[]>(`${this.baseUrl}/requisitos/`);
  }
}
