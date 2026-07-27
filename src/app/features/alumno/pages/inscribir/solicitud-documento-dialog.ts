import { Component, Inject, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DetalleProgramaAlumnoService } from '../../services/detalle-programa-alumno.service';
import { SolicitudDocumento, SolicitudIncorporacion } from '../../models/solicitud-incorporacion.model';
import { environment } from '../../../../../environments/environment';

export interface SolicitudDocumentoDialogData {
  solicitud: SolicitudIncorporacion;
  documento: SolicitudDocumento;
}

@Component({
  selector: 'app-solicitud-documento-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatIconModule, MatButtonModule,
    MatTooltipModule, MatProgressBarModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-left">
        <div class="doc-icon-lg" [class.uploaded]="doc.url_documento">
          <mat-icon>{{ doc.url_documento ? 'description' : 'upload_file' }}</mat-icon>
        </div>
        <div class="header-info">
          <h2 mat-dialog-title>{{ doc.nombre_requisito }}</h2>
          <span class="status-badge" [class]="'badge-' + (doc.url_documento ? 'uploaded' : 'pending')">
            {{ doc.url_documento ? 'Subido' : 'Pendiente' }}
          </span>
        </div>
      </div>
      <button mat-icon-button (click)="close()" class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    @if (doc.url_documento) {
      <mat-dialog-content class="dialog-content">
        <div class="uploaded-view">
          <div class="preview-box">
            @if (isPdfUrl(doc.url_documento)) {
              <div class="pdf-placeholder">
                <mat-icon>picture_as_pdf</mat-icon>
                <span>PDF</span>
              </div>
            } @else {
              <img [src]="getDocUrl(doc.url_documento)" alt="Documento" class="preview-img" />
            }
          </div>
          <div class="uploaded-actions">
            <a mat-stroked-button [href]="getDocUrl(doc.url_documento)" target="_blank" class="action-btn">
              <mat-icon>open_in_new</mat-icon> Abrir en nueva pestaña
            </a>
            <button mat-stroked-button color="warn" class="action-btn" (click)="reemplazar()">
              <mat-icon>swap_horiz</mat-icon> Reemplazar
            </button>
          </div>
        </div>
      </mat-dialog-content>
    }

    @if (!doc.url_documento && !subiendo()) {
      <mat-dialog-content class="dialog-content">
        <label class="drop-area" [for]="'fileInput-' + doc.id_solicitud_documento">
          <div class="drop-icon">
            <mat-icon>cloud_upload</mat-icon>
          </div>
          <h3>Seleccioná el archivo</h3>
          <p>Hacé click aquí para elegir tu archivo</p>
          <span class="formats">PDF, JPG, PNG, GIF o WebP — máx. 10 MB</span>
          <input [id]="'fileInput-' + doc.id_solicitud_documento" type="file"
                 accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                 hidden (change)="onFileSelected($event)">
        </label>
      </mat-dialog-content>
    }

    @if (archivoSeleccionado()) {
      <mat-dialog-content class="dialog-content">
        <div class="confirm-preview">
          <div class="confirm-file">
            @if (esPdf()) {
              <mat-icon class="file-icon pdf">picture_as_pdf</mat-icon>
            } @else if (previewUrl()) {
              <img [src]="previewUrl()" class="preview-thumb" />
            } @else {
              <mat-icon class="file-icon img">image</mat-icon>
            }
            <div class="confirm-info">
              <span class="file-name">{{ nombreArchivo() }}</span>
              <span class="file-size">{{ tamanoArchivo() }}</span>
            </div>
          </div>
          <div class="confirm-actions">
            <button mat-button (click)="limpiarArchivo()">
              <mat-icon>close</mat-icon> Cancelar
            </button>
            <button mat-flat-button color="primary" (click)="subirDocumento()" [disabled]="subiendo()">
              @if (subiendo()) {
                <mat-icon class="spin">sync</mat-icon> Subiendo...
              } @else {
                <mat-icon>send</mat-icon> Confirmar y subir
              }
            </button>
          </div>
        </div>
      </mat-dialog-content>
    }

    @if (subiendo()) {
      <mat-dialog-content class="dialog-content">
        <div class="uploading-state">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Subiendo documento...</span>
        </div>
      </mat-dialog-content>
    }
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 20px 24px 0;
    }
    .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .doc-icon-lg {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: #fef3c7; color: #d97706; flex-shrink: 0;
    }
    .doc-icon-lg.uploaded { background: #d1fae5; color: #059669; }
    .doc-icon-lg mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .header-info h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--fich-text); }
    .status-badge {
      display: inline-block; font-size: 0.68rem; font-weight: 600;
      padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .badge-uploaded { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #f1f5f9; color: #64748b; }
    .close-btn { flex-shrink: 0; }

    .dialog-content { padding: 16px 24px !important; }

    /* Uploaded view */
    .uploaded-view { display: flex; flex-direction: column; gap: 16px; }
    .preview-box {
      border: 1px solid var(--fich-border-light); border-radius: 10px;
      overflow: hidden; background: #f8fafc; display: flex;
      align-items: center; justify-content: center; min-height: 200px;
    }
    .preview-img { max-width: 100%; max-height: 400px; object-fit: contain; }
    .pdf-placeholder {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 40px; color: #dc2626;
    }
    .pdf-placeholder mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .pdf-placeholder span { font-size: 0.85rem; font-weight: 600; }
    .uploaded-actions { display: flex; gap: 8px; }
    .action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      height: 36px !important; font-size: 0.82rem !important;
    }

    /* Drop area */
    .drop-area {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 40px 24px; border: 2px dashed var(--fich-border);
      border-radius: 12px; cursor: pointer; transition: all 0.2s; text-align: center;
    }
    .drop-area:hover { border-color: #0d9488; background: #f0fdfa; }
    .drop-icon mat-icon { font-size: 40px; width: 40px; height: 40px; color: #0d9488; }
    .drop-area h3 { margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--fich-text); }
    .drop-area p { margin: 0; font-size: 0.82rem; color: var(--fich-text-muted); }
    .formats { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }

    /* Confirm preview */
    .confirm-preview {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; padding: 14px 16px;
      background: var(--fich-primary-light, #ecfeff);
      border: 1px solid var(--fich-primary, #0891b2);
      border-radius: 10px;
    }
    .confirm-file { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .file-icon { width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .file-icon.pdf { background: #fef2f2; color: #dc2626; font-size: 22px; }
    .file-icon.img { background: #eff6ff; color: #2563eb; font-size: 22px; }
    .preview-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .confirm-info { display: flex; flex-direction: column; min-width: 0; }
    .file-name { font-size: 0.85rem; font-weight: 600; color: var(--fich-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-size { font-size: 0.75rem; color: var(--fich-text-muted); }
    .confirm-actions { display: flex; gap: 8px; flex-shrink: 0; }

    /* Uploading */
    .uploading-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 32px 0;
    }
    .uploading-state span { font-size: 0.85rem; color: var(--fich-text-muted); }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  `],
})
export class SolicitudDocumentoDialogComponent {
  private detalleService = inject(DetalleProgramaAlumnoService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  apiUrl = environment.apiUrl;
  doc: SolicitudDocumento;
  solicitudId: number;

  archivoSeleccionado = signal<File | null>(null);
  nombreArchivo = signal('');
  tamanoArchivo = signal('');
  previewUrl = signal('');
  esPdf = signal(false);
  subiendo = signal(false);

  constructor(
    public dialogRef: MatDialogRef<SolicitudDocumentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SolicitudDocumentoDialogData,
  ) {
    this.doc = { ...data.documento };
    this.solicitudId = data.solicitud.id_solicitud;
  }

  getDocUrl(url: string | null): string {
    return url ? `${this.apiUrl}${url}` : '';
  }

  isPdfUrl(url: string | null): boolean {
    return url?.toLowerCase().endsWith('.pdf') ?? false;
  }

  reemplazar(): void {
    this.doc = { ...this.doc, url_documento: null };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo no puede superar 10 MB', 'Cerrar', { duration: 3000 });
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      this.snackBar.open('Formato no permitido', 'Cerrar', { duration: 3000 });
      return;
    }

    this.archivoSeleccionado.set(file);
    this.nombreArchivo.set(file.name);
    this.tamanoArchivo.set(this._formatSize(file.size));
    this.esPdf.set(file.type === 'application/pdf');

    if (!this.esPdf()) {
      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl.set('');
    }

    input.value = '';
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado.set(null);
    this.nombreArchivo.set('');
    this.tamanoArchivo.set('');
    this.previewUrl.set('');
    this.esPdf.set(false);
  }

  subirDocumento(): void {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.subiendo.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.detalleService.subirDocumentoSolicitud(this.solicitudId, this.doc.id_solicitud_documento, base64)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updatedSol) => {
            this.subiendo.set(false);
            this.doc = { ...this.doc, url_documento: updatedSol.documentos.find(d => d.id_solicitud_documento === this.doc.id_solicitud_documento)?.url_documento || this.doc.url_documento };
            this.limpiarArchivo();
            this.snackBar.open('Documento subido correctamente', 'Cerrar', { duration: 2000 });
            this.dialogRef.close(updatedSol);
          },
          error: (err) => {
            this.subiendo.set(false);
            this.snackBar.open(err.error?.detail || 'Error al subir documento', 'Cerrar', { duration: 4000 });
          },
        });
    };
    reader.onerror = () => {
      this.subiendo.set(false);
      this.snackBar.open('Error al leer el archivo', 'Cerrar', { duration: 4000 });
    };
    reader.readAsDataURL(file);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private _formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
