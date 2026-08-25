import { Component, Inject, signal, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentacionService } from '../../services/documentacion.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  PostulanteResponse,
  ControlDocumentacionResponse,
  RequisitoColumn,
} from '../../models/documentacion.model';
import { environment } from '../../../../../environments/environment';

export interface DocMatrizDialogData {
  postulante: PostulanteResponse;
  requisitos: RequisitoColumn[];
}

@Component({
  selector: 'app-doc-matriz-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatSnackBarModule, MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './doc-matriz-dialog.html',
  styleUrl: './doc-matriz-dialog.css',
})
export class DocMatrizDialogComponent {
  private service = inject(DocumentacionService);
  private auth = inject(AuthService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  rejectingDocId = signal<number | null>(null);
  rejectObservacion = signal('');

  apiUrl = environment.apiUrl;

  p: PostulanteResponse;
  requisitos: RequisitoColumn[];

  constructor(
    public dialogRef: MatDialogRef<DocMatrizDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocMatrizDialogData,
  ) {
    this.p = { ...data.postulante, control_documentacion: [...data.postulante.control_documentacion] };
    this.requisitos = data.requisitos;
  }

  get nombreCompleto(): string {
    if (!this.p.alumno) return 'Sin datos';
    return `${this.p.alumno.nombre} ${this.p.alumno.apellido}`;
  }

  get iniciales(): string {
    if (!this.p.alumno) return '??';
    return (this.p.alumno.nombre[0] + this.p.alumno.apellido[0]).toUpperCase();
  }

  get progresoPct(): number {
    if (this.p.docs_total === 0) return 0;
    return Math.round((this.p.docs_completados / this.p.docs_total) * 100);
  }

  getCelda(reqId: number): ControlDocumentacionResponse | null {
    return this.p.control_documentacion.find(d => d.id_requisito === reqId) || null;
  }

  cellIcon(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'radio_button_unchecked',
      entregado: 'schedule',
      aceptado: 'check_circle',
      rechazado: 'cancel',
    };
    return map[estado] || 'help_outline';
  }

  badgeLabel(estado: string): string {
    const map: Record<string, string> = {
      aceptado: 'Aprobado',
      rechazado: 'Rechazado',
      entregado: 'En revisión',
      pendiente: 'Pendiente',
    };
    return map[estado] || estado;
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'estado-postulante',
      observado: 'estado-observado',
      inscrito: 'estado-inscrito',
      incorporado: 'estado-incorporado',
      finalizado: 'estado-finalizado',
      retirado: 'estado-retirado',
    };
    return map[estado] || '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'Postulante',
      observado: 'Observado',
      inscrito: 'Inscrito',
      incorporado: 'Incorporado',
      finalizado: 'Finalizado',
      retirado: 'Retirado',
    };
    return map[estado] || estado;
  }

  canApprove(doc: ControlDocumentacionResponse): boolean {
    return doc.estado === 'entregado' || doc.estado === 'pendiente';
  }

  isManualApproval(doc: ControlDocumentacionResponse): boolean {
    return doc.estado === 'aceptado' && !doc.url_documento;
  }

  get canAprobar(): boolean {
    return this.auth.hasPermiso('documentos.aprobar');
  }

  approveDoc(doc: ControlDocumentacionResponse): void {
    this.service.updateControlDocumentacion(doc.id_control_documentacion, { estado: 'aceptado' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          doc.estado = 'aceptado';
          this.recalcProgress();
          this.cdr.detectChanges();
          this.snackbar.open('Documento aprobado', 'Cerrar', { duration: 1500 });
        },
        error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
      });
  }

  startReject(doc: ControlDocumentacionResponse): void {
    this.rejectingDocId.set(doc.id_control_documentacion);
    this.rejectObservacion.set(doc.observaciones || '');
  }

  cancelReject(): void {
    this.rejectingDocId.set(null);
    this.rejectObservacion.set('');
  }

  confirmReject(doc: ControlDocumentacionResponse): void {
    const obs = this.rejectObservacion().trim();
    if (!obs) {
      this.snackbar.open('Debe escribir un motivo de rechazo', 'Cerrar', { duration: 3000 });
      return;
    }

    this.service.updateControlDocumentacion(doc.id_control_documentacion, {
      estado: 'rechazado',
      observaciones: obs,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        doc.estado = 'rechazado';
        doc.observaciones = obs;
        this.rejectingDocId.set(null);
        this.rejectObservacion.set('');
        this.recalcProgress();
        this.cdr.detectChanges();
        this.snackbar.open('Documento rechazado', 'Cerrar', { duration: 1500 });
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
    });
  }

  verDocumento(url: string): void {
    window.open(`${this.apiUrl}${url}`, '_blank');
  }

  private recalcProgress(): void {
    this.p.docs_completados = this.p.control_documentacion.filter(d => d.estado === 'aceptado').length;
    const obligatorios = this.p.control_documentacion.filter(d => d.obligatorio);
    if (obligatorios.length > 0 && obligatorios.every(d => d.estado === 'aceptado') && this.p.estado === 'postulante') {
      this.p.estado = 'inscrito';
    }
  }

  close(): void {
    this.dialogRef.close(this.p);
  }
}
