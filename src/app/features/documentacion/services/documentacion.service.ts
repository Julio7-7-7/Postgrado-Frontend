import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  ProgramaVersionEdicionResponse, PostulanteResponse, ControlDocumentacionUpdate,
} from '../models/documentacion.model';

@Injectable({ providedIn: 'root' })
export class DocumentacionService extends ApiService {
  getEdiciones(): Observable<ProgramaVersionEdicionResponse[]> {
    return this.http.get<ProgramaVersionEdicionResponse[]>(`${this.baseUrl}/programa-version-edicion/`);
  }

  getPostulantesPorEdicion(idEdicion: number): Observable<PostulanteResponse[]> {
    return this.http.get<PostulanteResponse[]>(`${this.baseUrl}/programa-version-edicion/${idEdicion}/postulantes`);
  }

  updateControlDocumentacion(id: number, data: ControlDocumentacionUpdate): Observable<any> {
    return this.http.patch(`${this.baseUrl}/control-documentacion/${id}`, data);
  }
}
