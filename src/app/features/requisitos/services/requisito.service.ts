import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { RequisitoResponse, RequisitoCreate, RequisitoUpdate } from '../models/requisito.model';

@Injectable({ providedIn: 'root' })
export class RequisitoService extends ApiService {
  getAll(): Observable<RequisitoResponse[]> {
    return this.http.get<RequisitoResponse[]>(`${this.baseUrl}/requisitos/`);
  }

  getById(id: number): Observable<RequisitoResponse> {
    return this.http.get<RequisitoResponse>(`${this.baseUrl}/requisitos/${id}`);
  }

  create(data: RequisitoCreate): Observable<RequisitoResponse> {
    return this.http.post<RequisitoResponse>(`${this.baseUrl}/requisitos/`, data);
  }

  update(id: number, data: RequisitoUpdate): Observable<RequisitoResponse> {
    return this.http.patch<RequisitoResponse>(`${this.baseUrl}/requisitos/${id}`, data);
  }
}
