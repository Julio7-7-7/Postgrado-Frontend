import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProgramaVersionEdicion, ProgramaVersionEdicionCreate } from '../models/edicion.model';
import { PostulanteResponse } from '../../documentacion/models/documentacion.model';

@Injectable({ providedIn: 'root' })
export class EdicionService extends ApiService {
  private readonly endpoint = 'programa-version-edicion';

  getAll(programa_version_id?: number, activas?: boolean): Observable<ProgramaVersionEdicion[]> {
    let params = new HttpParams();
    if (programa_version_id) params = params.set('programa_version_id', programa_version_id);
    if (activas) params = params.set('activas', 'true');
    return this.http.get<ProgramaVersionEdicion[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }

  getById(id: number): Observable<ProgramaVersionEdicion> {
    return this.http.get<ProgramaVersionEdicion>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  getActivas(): Observable<ProgramaVersionEdicion[]> {
    return this.http.get<ProgramaVersionEdicion[]>(`${this.baseUrl}/${this.endpoint}/activas`);
  }

  getPostulantes(idEdicion: number): Observable<PostulanteResponse[]> {
    return this.http.get<PostulanteResponse[]>(`${this.baseUrl}/${this.endpoint}/${idEdicion}/postulantes`);
  }

  create(data: ProgramaVersionEdicionCreate): Observable<ProgramaVersionEdicion> {
    return this.http.post<ProgramaVersionEdicion>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<ProgramaVersionEdicionCreate>): Observable<ProgramaVersionEdicion> {
    return this.http.patch<ProgramaVersionEdicion>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }
}
