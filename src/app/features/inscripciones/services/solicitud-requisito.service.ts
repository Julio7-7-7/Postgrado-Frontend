import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SolicitudRequisito, Requisito } from '../models/solicitud-requisito.model';

@Injectable({ providedIn: 'root' })
export class SolicitudRequisitoService extends ApiService {

  getRequisitosConfigurados(idTipoSolicitud: number): Observable<SolicitudRequisito[]> {
    return this.http.get<SolicitudRequisito[]>(`${this.baseUrl}/solicitud-requisitos/`, {
      params: { id_tipo_solicitud: idTipoSolicitud.toString() },
    });
  }

  agregarRequisito(idRequisito: number, idTipoSolicitud: number = 1): Observable<SolicitudRequisito> {
    return this.http.post<SolicitudRequisito>(
      `${this.baseUrl}/solicitud-requisitos/`,
      { id_requisito: idRequisito, id_tipo_solicitud: idTipoSolicitud }
    );
  }

  toggleEstado(id: number, activo: boolean): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/solicitud-requisitos/${id}/cambiar-estado`,
      { estado: activo ? 'activo' : 'inactivo' }
    );
  }

  getTodosLosRequisitos(): Observable<Requisito[]> {
    return this.http.get<Requisito[]>(`${this.baseUrl}/requisitos/?estado=activo`);
  }
}
