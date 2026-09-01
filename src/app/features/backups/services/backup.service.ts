import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Backup, ImportarBackupResult } from '../models/backup.model';

@Injectable({ providedIn: 'root' })
export class BackupService extends ApiService {
  private readonly endpoint = 'backups';

  listar(): Observable<Backup[]> {
    return this.http.get<Backup[]>(`${this.baseUrl}/${this.endpoint}`);
  }

  generar(): Observable<Backup> {
    return this.http.post<Backup>(`${this.baseUrl}/${this.endpoint}/generar`, {});
  }

  descargar(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${this.endpoint}/${id}/descargar`, { responseType: 'blob' });
  }

  eliminar(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/${this.endpoint}/${id}`);
  }

  importar(file: File): Observable<ImportarBackupResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<ImportarBackupResult>(`${this.baseUrl}/${this.endpoint}/importar`, formData);
  }
}
