import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProgramaVersion, ProgramaVersionCreate } from '../models/programa-version.model';

@Injectable({ providedIn: 'root' })
export class ProgramaVersionService extends ApiService {
  private readonly endpoint = 'programas-version';

  getAll(): Observable<ProgramaVersion[]> {
    return this.http.get<ProgramaVersion[]>(`${this.baseUrl}/${this.endpoint}/`);
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
