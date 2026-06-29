import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { HistorialModulo } from '../models/historial.model';

@Injectable({ providedIn: 'root' })
export class HistorialService extends ApiService {
  private readonly endpoint = 'historial-modulo';

  getByDetalle(detalleId: number): Observable<HistorialModulo[]> {
    return this.http.get<HistorialModulo[]>(
      `${this.baseUrl}/${this.endpoint}/detalle/${detalleId}`
    );
  }

  getByDetalleEnriquecido(detalleId: number): Observable<HistorialModulo[]> {
    return this.http.get<HistorialModulo[]>(
      `${this.baseUrl}/${this.endpoint}/detalle/${detalleId}/enriquecido`
    );
  }
}
