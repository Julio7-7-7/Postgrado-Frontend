import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  RolResponse, RolCreate, RolUpdate,
  PermisoResponse,
  UserAdminResponse, UserAdminCreate, UserAdminUpdate, UserUpdateRoles,
  PaginatedUsersResponse,
  TipoDescuentoResponse, TipoDescuentoCreate, TipoDescuentoUpdate,
  ModalidadAcademicaResponse, ModalidadAcademicaCreate, ModalidadAcademicaUpdate,
  RequisitoResponse, RequisitoCreate, RequisitoUpdate,
  PostulanteResponse, ControlDocumentacionUpdate,
  ProgramaVersionEdicionResponse,
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService extends ApiService {
  getAllRoles(): Observable<RolResponse[]> {
    return this.http.get<RolResponse[]>(`${this.baseUrl}/roles/`);
  }

  getRol(id: number): Observable<RolResponse> {
    return this.http.get<RolResponse>(`${this.baseUrl}/roles/${id}`);
  }

  createRol(data: RolCreate): Observable<RolResponse> {
    return this.http.post<RolResponse>(`${this.baseUrl}/roles/`, data);
  }

  updateRol(id: number, data: RolUpdate): Observable<RolResponse> {
    return this.http.put<RolResponse>(`${this.baseUrl}/roles/${id}`, data);
  }

  deleteRol(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}`);
  }

  getAllPermisos(): Observable<PermisoResponse[]> {
    return this.http.get<PermisoResponse[]>(`${this.baseUrl}/permisos/`);
  }

  getAllUsers(page: number = 1, perPage: number = 20): Observable<PaginatedUsersResponse> {
    return this.http.get<PaginatedUsersResponse>(`${this.baseUrl}/usuarios/?page=${page}&per_page=${perPage}`);
  }

  getUser(id: number): Observable<UserAdminResponse> {
    return this.http.get<UserAdminResponse>(`${this.baseUrl}/usuarios/${id}`);
  }

  createUser(data: UserAdminCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/usuarios/`, data);
  }

  updateUser(id: number, data: UserAdminUpdate): Observable<UserAdminResponse> {
    return this.http.patch<UserAdminResponse>(`${this.baseUrl}/usuarios/${id}`, data);
  }

  updateUserRoles(id: number, data: UserUpdateRoles): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/${id}/roles`, data);
  }

  toggleUserActive(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/${id}/activo`, {});
  }

  getTiposDescuento(): Observable<TipoDescuentoResponse[]> {
    return this.http.get<TipoDescuentoResponse[]>(`${this.baseUrl}/tipos-descuento/`);
  }

  createTipoDescuento(data: TipoDescuentoCreate): Observable<TipoDescuentoResponse> {
    return this.http.post<TipoDescuentoResponse>(`${this.baseUrl}/tipos-descuento/`, data);
  }

  getModalidades(): Observable<ModalidadAcademicaResponse[]> {
    return this.http.get<ModalidadAcademicaResponse[]>(`${this.baseUrl}/modalidades-academicas/`);
  }

  createModalidad(data: ModalidadAcademicaCreate): Observable<ModalidadAcademicaResponse> {
    return this.http.post<ModalidadAcademicaResponse>(`${this.baseUrl}/modalidades-academicas/`, data);
  }

  updateModalidad(id: number, data: ModalidadAcademicaUpdate): Observable<ModalidadAcademicaResponse> {
    return this.http.patch<ModalidadAcademicaResponse>(`${this.baseUrl}/modalidades-academicas/${id}`, data);
  }

  getRequisitos(): Observable<RequisitoResponse[]> {
    return this.http.get<RequisitoResponse[]>(`${this.baseUrl}/requisitos/`);
  }

  createRequisito(data: RequisitoCreate): Observable<RequisitoResponse> {
    return this.http.post<RequisitoResponse>(`${this.baseUrl}/requisitos/`, data);
  }

  updateRequisito(id: number, data: RequisitoUpdate): Observable<RequisitoResponse> {
    return this.http.patch<RequisitoResponse>(`${this.baseUrl}/requisitos/${id}`, data);
  }

  deleteRequisito(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/requisitos/${id}`);
  }

  updateTipoDescuento(id: number, data: TipoDescuentoUpdate): Observable<TipoDescuentoResponse> {
    return this.http.patch<TipoDescuentoResponse>(`${this.baseUrl}/tipos-descuento/${id}`, data);
  }

  getPostulantesPorEdicion(idEdicion: number): Observable<PostulanteResponse[]> {
    return this.http.get<PostulanteResponse[]>(`${this.baseUrl}/programa-version-edicion/${idEdicion}/postulantes`);
  }

  updateControlDocumentacion(id: number, data: ControlDocumentacionUpdate): Observable<any> {
    return this.http.patch(`${this.baseUrl}/control-documentacion/${id}`, data);
  }

  getEdiciones(): Observable<ProgramaVersionEdicionResponse[]> {
    return this.http.get<ProgramaVersionEdicionResponse[]>(`${this.baseUrl}/programa-version-edicion/`);
  }
}
