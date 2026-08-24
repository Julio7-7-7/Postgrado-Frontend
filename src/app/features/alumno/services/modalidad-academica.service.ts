import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ModalidadAcademica } from '../models/modalidad-academica.model';

@Injectable({ providedIn: 'root' })
export class ModalidadAcademicaService extends ApiService {
  private readonly endpoint = 'modalidades-academicas';

  getAll(idTipoPrograma?: number): Observable<ModalidadAcademica[]> {
    const params: any = {};
    if (idTipoPrograma != null) params.id_tipo_programa = idTipoPrograma;
    return this.http.get<ModalidadAcademica[]>(`${this.baseUrl}/${this.endpoint}/`, { params });
  }
}
