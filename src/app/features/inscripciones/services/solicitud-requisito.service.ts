import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SolicitudRequisito, Requisito } from '../models/solicitud-requisito.model';

@Injectable({ providedIn: 'root' })
export class SolicitudRequisitoService extends ApiService {

  getRequisitosConfigurados(): Observable<SolicitudRequisito[]> {
    return this.http.get<SolicitudRequisito[]>(`${this.baseUrl}/solicitud-requisitos/`);
  }

  agregarRequisito(idRequisito: number, obligatorio: boolean = true): Observable<SolicitudRequisito> {
    return this.http.post<SolicitudRequisito>(
      `${this.baseUrl}/solicitud-requisitos/`,
      { id_requisito: idRequisito, obligatorio }
    );
  }

  toggleEstado(id: number, activo: boolean): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/solicitud-requisitos/${id}/cambiar-estado`,
      { estado: activo ? 'activo' : 'inactivo' }
    );
  }

  actualizarObligatorio(id: number, obligatorio: boolean): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/solicitud-requisitos/${id}`,
      { obligatorio }
    );
  }

  getTodosLosRequisitos(): Observable<Requisito[]> {
    return this.http.get<Requisito[]>(`${this.baseUrl}/requisitos/?estado=activo`);
  }
}
