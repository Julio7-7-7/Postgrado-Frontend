import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { TipoPrograma, TipoProgramaCreate } from '../models/tipo-programa.model';

@Injectable({
  providedIn: 'root'
})
export class TipoProgramaService extends ApiService {
  
  private readonly endpoint = 'tipos-programa';

  /**
   * Obtiene todos los registros (activos e inactivos)
   */
  getAll(): Observable<TipoPrograma[]> {
    return this.http.get<TipoPrograma[]>(`${this.baseUrl}/${this.endpoint}/`);
  }

  /**
   * Busca un registro por su ID
   */
  getById(id: number): Observable<TipoPrograma> {
    return this.http.get<TipoPrograma>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  /**
   * Crea un nuevo registro
   */
  create(data: TipoProgramaCreate): Observable<TipoPrograma> {
    return this.http.post<TipoPrograma>(`${this.baseUrl}/${this.endpoint}/`, data);
  }

  /**
   * Actualización parcial (PATCH). 
   * Se usará tanto para editar datos como para cambiar el 'estado'.
   */
  update(id: number, data: Partial<TipoProgramaCreate>): Observable<TipoPrograma> {
    return this.http.patch<TipoPrograma>(`${this.baseUrl}/${this.endpoint}/${id}`, data);
  }

  // Se elimina el método delete() físico para proteger la integridad de los datos.
}