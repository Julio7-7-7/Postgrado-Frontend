import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProgramaVersion, ProgramaVersionCreate, PaginatedProgramaVersion } from '../models/programa-version.model';

@Injectable({ providedIn: 'root' })
export class ProgramaVersionService extends ApiService {
  private readonly endpoint = 'programas-version';

  getAll(): Observable<ProgramaVersion[]> {
    return this.http.get<ProgramaVersion[]>(`${this.baseUrl}/${this.endpoint}/`);
  }

  getPaginadas(programaId: number, page: number, perPage: number): Observable<PaginatedProgramaVersion> {
    const params = new HttpParams()
      .set('programa_id', programaId)
      .set('page', page)
      .set('per_page', perPage);
    return this.http.get<PaginatedProgramaVersion>(`${this.baseUrl}/${this.endpoint}/paginadas/`, { params });
  }

  getById(id: number): Observable<ProgramaVersion> {
    return this.http.get<ProgramaVersion>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: ProgramaVersionCreate): Observable<ProgramaVersion> {
    return this.http.post<ProgramaVersion>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<ProgramaVersionCreate>): Observable<ProgramaVersion> {
    return this.http.patch<ProgramaVersion>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }
}
