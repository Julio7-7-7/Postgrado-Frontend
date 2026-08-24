import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { TipoDescuento } from '../models/tipo-descuento.model';

@Injectable({ providedIn: 'root' })
export class TipoDescuentoService extends ApiService {
  private readonly endpoint = 'tipos-descuento';

  getAll(idTipoPrograma?: number): Observable<TipoDescuento[]> {
    const params: any = {};
    if (idTipoPrograma != null) params.id_tipo_programa = idTipoPrograma;
    return this.http.get<TipoDescuento[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }
}
