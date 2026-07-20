import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface DashboardStats {
  total_programas: number;
  total_docentes: number;
  total_tipos: number;
  total_alumnos: number;
  total_inscripciones: number;
  inscripciones_activas: number;
  total_pagos_confirmados: number;
  monto_total_pagos: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiService {
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`);
  }
}
