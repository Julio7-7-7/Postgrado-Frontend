import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  OpcionesReportes,
  ReporteEconomico,
  ReportePoblacion,
  ReporteRendimiento,
} from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService extends ApiService {
  private readonly endpoint = 'reportes';

  opciones(): Observable<OpcionesReportes> {
    return this.http.get<OpcionesReportes>(`${this.baseUrl}/${this.endpoint}/opciones`);
  }

  economico(params: {
    desde?: string;
    hasta?: string;
    id_carrera?: number | null;
  }): Observable<ReporteEconomico> {
    return this.http.get<ReporteEconomico>(`${this.baseUrl}/${this.endpoint}/economico`, { params: this.clean(params) });
  }

  poblacion(params: {
    desde?: string;
    hasta?: string;
    id_programa?: number | null;
  }): Observable<ReportePoblacion> {
    return this.http.get<ReportePoblacion>(`${this.baseUrl}/${this.endpoint}/poblacion`, { params: this.clean(params) });
  }

  rendimiento(params: {
    desde?: string;
    hasta?: string;
    id_programa?: number | null;
  }): Observable<ReporteRendimiento> {
    return this.http.get<ReporteRendimiento>(`${this.baseUrl}/${this.endpoint}/rendimiento`, { params: this.clean(params) });
  }

  private clean(params: Record<string, unknown>): Record<string, string | number> {
    const out: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') out[k] = v as string | number;
    }
    return out;
  }
}
