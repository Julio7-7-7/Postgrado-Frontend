import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProgramaVersionEdicion, ProgramaVersionEdicionCreate } from '../models/edicion.model';

@Injectable({ providedIn: 'root' })
export class EdicionService extends ApiService {
  private readonly endpoint = 'programa-version-edicion';

  getAll(): Observable<ProgramaVersionEdicion[]> {
    return this.http.get<ProgramaVersionEdicion[]>(`${this.baseUrl}/${this.endpoint}/`);
  }

  getById(id: number): Observable<ProgramaVersionEdicion> {
    return this.http.get<ProgramaVersionEdicion>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  create(data: ProgramaVersionEdicionCreate): Observable<ProgramaVersionEdicion> {
    return this.http.post<ProgramaVersionEdicion>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  update(id: number, data: Partial<ProgramaVersionEdicionCreate>): Observable<ProgramaVersionEdicion> {
    return this.http.patch<ProgramaVersionEdicion>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }
}
