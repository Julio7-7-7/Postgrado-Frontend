import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Docente } from '../models/docente.model';

@Injectable({ providedIn: 'root' })
export class DocenteService extends ApiService {
  private readonly endpoint = 'docentes';

  getAll(estado?: string): Observable<Docente[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Docente[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }
}
