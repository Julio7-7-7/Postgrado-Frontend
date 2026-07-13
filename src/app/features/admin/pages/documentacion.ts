import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import {
  ProgramaVersionEdicionResponse,
  PostulanteResponse,
  ControlDocumentacionResponse,
} from '../models/admin.models';

@Component({
  selector: 'app-documentacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div>
          <h1>Gestionar Documentación</h1>
          <p class="subtitle">Revisá y aprobá la documentación de los postulantes</p>
        </div>
      </div>

      <div class="selector-card">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Seleccionar edición</mat-label>
          <mat-select (selectionChange)="cargarPostulantes($event.value)">
            @for (ed of ediciones(); track ed.id_programa_version_edicion) {
              <mat-option [value]="ed.id_programa_version_edicion">
                {{ programaNombre(ed) }} — Edición #{{ ed.edicion }} ({{ ed.semestre }}-{{ ed.anio }})
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Cargando postulantes...</span>
        </div>
      } @else if (edicionSeleccionada()) {
        @if (postulantes().length === 0) {
          <div class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <p>No hay postulantes en esta edición</p>
          </div>
        } @else {
          <div class="postulantes-list">
            @for (p of postulantes(); track p.id_detalle_programa_alumno) {
              <div class="postulante-card" [class.expanded]="expandedId() === p.id_detalle_programa_alumno">
                <div class="postulante-header" (click)="toggleExpand(p.id_detalle_programa_alumno)">
                  <div class="postulante-info">
                    <div class="avatar">{{ iniciales(p) }}</div>
                    <div>
                      <div class="postulante-nombre">{{ p.alumno?.nombre }} {{ p.alumno?.apellido }}</div>
                      <div class="postulante-meta">
                        CI: {{ p.alumno?.ci || '—' }} · {{ p.alumno?.correo || '—' }}
                      </div>
                    </div>
                  </div>
                  <div class="postulante-stats">
                    <span class="estado-pill" [class]="'estado-' + p.estado">{{ p.estado }}</span>
                    <span class="docs-count">{{ p.docs_completados }}/{{ p.docs_total }}</span>
                    <div class="progress-mini">
                      <div class="progress-mini-bar" [style.width.%]="p.docs_total > 0 ? (p.docs_completados / p.docs_total * 100) : 0"></div>
                    </div>
                    <mat-icon class="expand-icon" [class.rotated]="expandedId() === p.id_detalle_programa_alumno">expand_more</mat-icon>
                  </div>
                </div>

                @if (expandedId() === p.id_detalle_programa_alumno) {
                  <div class="postulante-body">
                    @if (p.control_documentacion.length === 0) {
                      <div class="no-docs">Sin documentos requeridos</div>
                    }
                    @for (doc of p.control_documentacion; track doc.id_control_documentacion) {
                      <div class="doc-row" [class.obligatorio]="doc.obligatorio">
                        <div class="doc-estado">
                          @switch (doc.estado) {
                            @case ('pendiente') { <mat-icon class="status-icon pendiente">schedule</mat-icon> }
                            @case ('entregado') { <mat-icon class="status-icon entregado">upload_file</mat-icon> }
                            @case ('aceptado') { <mat-icon class="status-icon aceptado">check_circle</mat-icon> }
                            @case ('rechazado') { <mat-icon class="status-icon rechazado">cancel</mat-icon> }
                          }
                        </div>
                        <div class="doc-info">
                          <span class="doc-nombre">Requisito #{{ doc.id_requisito }}</span>
                          @if (doc.observaciones) {
                            <span class="doc-obs">{{ doc.observaciones }}</span>
                          }
                        </div>
                        <div class="doc-acciones">
                          @if (doc.estado === 'pendiente' || doc.estado === 'rechazado') {
                            <button mat-icon-button color="primary" (click)="cambiarEstado(doc, 'entregado')" title="Marcar entregado">
                              <mat-icon>upload</mat-icon>
                            </button>
                          }
                          @if (doc.estado === 'entregado') {
                            <button mat-icon-button color="primary" (click)="cambiarEstado(doc, 'aceptado')" title="Aprobar">
                              <mat-icon>check</mat-icon>
                            </button>
                            <button mat-icon-button color="warn" (click)="rechazar(doc)" title="Rechazar">
                              <mat-icon>close</mat-icon>
                            </button>
                          }
                          @if (doc.estado === 'aceptado') {
                            <span class="doc-check">✓ Aprobado</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }

    .header-section {
      margin-bottom: 24px;
    }

    .header-section h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .subtitle {
      margin: 4px 0 0;
      color: #94a3b8;
      font-size: 0.88rem;
    }

    .selector-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .full-width { width: 100%; }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px;
      color: #94a3b8;
    }

    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .postulantes-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .postulante-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.15s;
    }

    .postulante-card.expanded {
      border-color: #c7d2fe;
    }

    .postulante-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .postulante-header:hover { background: #f8fafc; }

    .postulante-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .postulante-nombre {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .postulante-meta {
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .postulante-stats {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .estado-pill {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .estado-postulante { background: #fef3c7; color: #92400e; }
    .estado-inscrito { background: #d1fae5; color: #065f46; }
    .estado-egresado { background: #e0e7ff; color: #3730a3; }

    .docs-count {
      font-size: 0.82rem;
      font-weight: 700;
      color: #475569;
    }

    .progress-mini {
      width: 60px;
      height: 4px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-mini-bar {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: 4px;
      transition: width 0.3s;
    }

    .expand-icon {
      color: #94a3b8;
      transition: transform 0.2s;
    }

    .expand-icon.rotated { transform: rotate(180deg); }

    .postulante-body {
      padding: 0 18px 14px;
      border-top: 1px solid #f1f5f9;
    }

    .no-docs {
      padding: 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.85rem;
    }

    .doc-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f8fafc;
    }

    .doc-row:last-child { border-bottom: none; }

    .doc-row.obligatorio .doc-nombre { font-weight: 600; }

    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-icon.pendiente { color: #f59e0b; }
    .status-icon.entregado { color: #3b82f6; }
    .status-icon.aceptado { color: #10b981; }
    .status-icon.rechazado { color: #ef4444; }

    .doc-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .doc-nombre {
      font-size: 0.88rem;
      color: #1e293b;
    }

    .doc-obs {
      font-size: 0.78rem;
      color: #ef4444;
    }

    .doc-acciones {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .doc-check {
      font-size: 0.82rem;
      font-weight: 600;
      color: #10b981;
    }
  `],
})
export class DocumentacionComponent implements OnInit {
  private service = inject(AdminService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  ediciones = signal<ProgramaVersionEdicionResponse[]>([]);
  postulantes = signal<PostulanteResponse[]>([]);
  isLoading = signal(false);
  edicionSeleccionada = signal<number | null>(null);
  expandedId = signal<number | null>(null);

  ngOnInit(): void {
    this.service.getEdiciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.ediciones.set(data),
      error: () => this.snackbar.open('Error al cargar ediciones', 'Cerrar', { duration: 3000 }),
    });
  }

  programaNombre(ed: ProgramaVersionEdicionResponse): string {
    return ed.programa_version?.programa?.nombre_programa || `Programa #${ed.programa_version?.id_programa_version}`;
  }

  cargarPostulantes(idEdicion: number): void {
    this.edicionSeleccionada.set(idEdicion);
    this.isLoading.set(true);
    this.expandedId.set(null);
    this.service.getPostulantesPorEdicion(idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.postulantes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar postulantes', 'Cerrar', { duration: 3000 });
      },
    });
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  iniciales(p: PostulanteResponse): string {
    if (!p.alumno) return '??';
    return (p.alumno.nombre[0] + p.alumno.apellido[0]).toUpperCase();
  }

  cambiarEstado(doc: ControlDocumentacionResponse, estado: string): void {
    this.service.updateControlDocumentacion(doc.id_control_documentacion, { estado })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          doc.estado = estado;
          this.snackbar.open('Estado actualizado', 'Cerrar', { duration: 2000 });
          this.recargarPostulantes();
        },
        error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
      });
  }

  rechazar(doc: ControlDocumentacionResponse): void {
    const obs = prompt('Observaciones (requerido para rechazar):');
    if (obs === null) return;
    if (!obs.trim()) {
      this.snackbar.open('Las observaciones son requeridas', 'Cerrar', { duration: 3000 });
      return;
    }
    this.service.updateControlDocumentacion(doc.id_control_documentacion, {
      estado: 'rechazado',
      observaciones: obs,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        doc.estado = 'rechazado';
        doc.observaciones = obs;
        this.snackbar.open('Documento rechazado', 'Cerrar', { duration: 2000 });
        this.recargarPostulantes();
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
    });
  }

  private recargarPostulantes(): void {
    const id = this.edicionSeleccionada();
    if (id) {
      this.service.getPostulantesPorEdicion(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => this.postulantes.set(data),
      });
    }
  }
}
