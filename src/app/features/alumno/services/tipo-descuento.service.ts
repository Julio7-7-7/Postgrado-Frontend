import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { TipoDescuento } from '../models/tipo-descuento.model';

@Injectable({ providedIn: 'root' })
export class TipoDescuentoService extends ApiService {
  private readonly endpoint = 'tipos-descuento';

  getAll(): Observable<TipoDescuento[]> {
    return this.http.get<TipoDescuento[]>(`${this.baseUrl}/${this.endpoint}/`);
  }
}
