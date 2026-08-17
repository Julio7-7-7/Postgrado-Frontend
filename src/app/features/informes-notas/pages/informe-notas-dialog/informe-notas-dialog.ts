import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InformeNotasService } from '../../services/informe-notas.service';
import { AlumnoElegible, InformeNotas } from '../../models/informe-notas.model';
import { DocumentacionService } from '../../../documentacion/services/documentacion.service';
import { ProgramaVersionEdicionResponse } from '../../../documentacion/models/documentacion.model';

@Component({
  selector: 'app-informe-notas-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatCheckboxModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon" style="background: linear-gradient(135deg, #15803d, #166534)">
        <mat-icon>summarize</mat-icon>
      </div>
      <div>
        <h2>Generar Informe de Notas</h2>
        <p class="header-sub">Emitir informe y certificados por tandas a direcciones de carrera</p>
      </div>
    </div>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Seleccionar edición</mat-label>
        <mat-select [(value)]="edicionSeleccionada" (selectionChange)="onEdicionChange()">
          @for (ed of ediciones(); track ed.id_programa_version_edicion) {
            <mat-option [value]="ed.id_programa_version_edicion">
              {{ programaNombre(ed) }} — Ed. {{ ed.edicion }} · {{ ed.anio }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (edicionSeleccionada()) {
        <div class="tanda-info">
          <span class="tanda-badge">Tanda #{{ tandaSiguiente() }}</span>
          @if (informesExistentes().length > 0) {
            <span class="tanda-hist">{{ informesExistentes().length }} tanda(s) anterior(es) enviada(s)</span>
          }
        </div>

        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="36"></mat-spinner>
            <span>Verificando elegibilidad...</span>
          </div>
        } @else if (alumnos().length === 0) {
          <div class="empty-state">
            <mat-icon>check_circle</mat-icon>
            <p>No hay alumnos elegibles para una nueva tanda.</p>
            <p class="empty-hint">Todos los alumnos con notas y pagos al día ya fueron incluidos en tandas anteriores.</p>
          </div>
        } @else {
          <div class="elegibles-section">
            <div class="section-header">
              <span class="count-badge">{{ seleccionados().length }}/{{ alumnos().length }}</span>
              <span>alumnos seleccionados</span>
              <button mat-button (click)="toggleAll()" class="toggle-all">
                {{ seleccionados().length === alumnos().length ? 'Deseleccionar' : 'Seleccionar todos' }}
              </button>
            </div>

            <div class="alumnos-list">
              @for (alumno of alumnos(); track alumno.id_alumno) {
                <label class="alumno-row" [class.selected]="isSelected(alumno.id_alumno)">
                  <mat-checkbox
                    [checked]="isSelected(alumno.id_alumno)"
                    (change)="toggle(alumno.id_alumno)"
                    color="primary">
                  </mat-checkbox>
                  <div class="alumno-info">
                    <span class="alumno-nombre">{{ alumno.apellido }} {{ alumno.nombre }}</span>
                    <span class="alumno-ci">CI: {{ alumno.ci || 'N/A' }}</span>
                  </div>
                </label>
              }
            </div>
          </div>

          <mat-form-field appearance="outline" class="full-width" style="margin-top: 12px">
            <mat-label>Observaciones (opcional)</mat-label>
            <textarea matInput [(ngModel)]="observaciones" rows="2"></textarea>
          </mat-form-field>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="seleccionados().length === 0 || creando()"
        (click)="crearInforme()">
        @if (creando()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          Generar Informe ({{ seleccionados().length }} alumnos)
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px 12px;
    }
    .header-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: white; flex-shrink: 0;
    }
    .dialog-header h2 { margin: 0; font-size: 1.15rem; font-weight: 600; }
    .header-sub { margin: 2px 0 0; font-size: 0.8rem; color: var(--fich-text-secondary); }

    mat-dialog-content { padding: 0 24px 16px; min-width: 480px; max-height: 540px; }

    .full-width { width: 100%; }

    .tanda-info {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 12px;
    }
    .tanda-badge {
      background: #15803d; color: white; padding: 3px 10px;
      border-radius: 10px; font-size: 0.8rem; font-weight: 600;
    }
    .tanda-hist { font-size: 0.78rem; color: var(--fich-text-secondary); }

    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; padding: 28px 0; text-align: center;
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; color: #047857; }
    .empty-hint { font-size: 0.8rem; color: var(--fich-text-secondary); margin: 0; }

    .elegibles-section { display: flex; flex-direction: column; gap: 10px; }
    .section-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.85rem; color: var(--fich-text-secondary);
    }
    .count-badge {
      background: #15803d; color: white; padding: 2px 8px;
      border-radius: 10px; font-size: 0.75rem; font-weight: 600;
    }
    .toggle-all { margin-left: auto; font-size: 0.78rem; }

    .alumnos-list {
      border: 1px solid var(--fich-border); border-radius: 10px;
      max-height: 260px; overflow-y: auto;
    }
    .alumno-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; cursor: pointer;
      border-bottom: 1px solid var(--fich-border-light);
      transition: background 0.15s;
    }
    .alumno-row:last-child { border-bottom: none; }
    .alumno-row:hover { background: var(--fich-bg-hover); }
    .alumno-row.selected { background: #ecfdf5; }
    .alumno-info { display: flex; flex-direction: column; }
    .alumno-nombre { font-size: 0.85rem; font-weight: 500; }
    .alumno-ci { font-size: 0.75rem; color: var(--fich-text-secondary); }

    mat-dialog-actions { padding: 8px 24px 16px; gap: 8px; }
  `],
})
export class InformeNotasDialogComponent implements OnInit {
  private service = inject(InformeNotasService);
  private docService = inject(DocumentacionService);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<InformeNotasDialogComponent>);

  ediciones = signal<ProgramaVersionEdicionResponse[]>([]);
  edicionSeleccionada = signal<number | null>(null);
  loading = signal(false);
  creando = signal(false);
  alumnos = signal<AlumnoElegible[]>([]);
  seleccionados = signal<number[]>([]);
  informesExistentes = signal<InformeNotas[]>([]);
  observaciones = '';
  tandaSiguiente = signal(1);

  ngOnInit() {
    this.docService.getEdiciones().subscribe({
      next: (eds) => this.ediciones.set(eds.filter(e => e.estado !== 'finalizado')),
    });
  }

  onEdicionChange() {
    const id = this.edicionSeleccionada();
    if (!id) return;
    this.loading.set(true);
    this.alumnos.set([]);
    this.seleccionados.set([]);

    this.service.getPorEdicion(id).subscribe({
      next: (informes) => {
        this.informesExistentes.set(informes);
        this.tandaSiguiente.set(informes.length + 1);
      },
    });

    this.service.getElegibles(id).subscribe({
      next: (res) => {
        this.alumnos.set(res.alumnos);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar elegibles', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  programaNombre(ed: ProgramaVersionEdicionResponse): string {
    return ed.programa_version?.programa?.nombre_programa || 'Programa';
  }

  isSelected(id: number): boolean {
    return this.seleccionados().includes(id);
  }

  toggle(id: number) {
    const current = this.seleccionados();
    if (current.includes(id)) {
      this.seleccionados.set(current.filter(x => x !== id));
    } else {
      this.seleccionados.set([...current, id]);
    }
  }

  toggleAll() {
    if (this.seleccionados().length === this.alumnos().length) {
      this.seleccionados.set([]);
    } else {
      this.seleccionados.set(this.alumnos().map(a => a.id_alumno));
    }
  }

  crearInforme() {
    const idEdicion = this.edicionSeleccionada();
    if (!idEdicion || this.seleccionados().length === 0) return;
    this.creando.set(true);

    this.service.crear({
      id_programa_version_edicion: idEdicion,
      numero_tanda: this.tandaSiguiente(),
      alumnos_ids: this.seleccionados(),
      observaciones: this.observaciones || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Informe generado exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.detail || 'Error al generar informe', 'Cerrar', { duration: 4000 });
        this.creando.set(false);
      },
    });
  }
}
