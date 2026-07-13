import { Component, OnInit, signal, inject, DestroyRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import { ModalidadAcademicaResponse, RequisitoResponse } from '../models/admin.models';

@Component({
  selector: 'app-modalidad-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>{{ data ? 'edit' : 'add' }}</mat-icon>
      </div>
      <div>
        <h2 mat-dialog-title>{{ data ? 'Editar Modalidad' : 'Nueva Modalidad' }}</h2>
        <p class="header-sub">{{ data ? 'Modificá los datos de la modalidad' : 'Creá una nueva modalidad académica' }}</p>
      </div>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre_modalidad" placeholder="Ej: Educación Continua">
            @if (form.get('nombre_modalidad')?.hasError('required')) {
              <mat-error>El nombre es obligatorio</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="descripcion" rows="2" placeholder="Descripción breve..."></textarea>
          </mat-form-field>
        </div>

        <div class="checkbox-row">
          <mat-checkbox formControlName="requiere_titulo">Requiere título habilitante</mat-checkbox>
          <mat-checkbox formControlName="uso_unico">Uso único (solo una inscripción por alumno)</mat-checkbox>
        </div>

        @if (data) {
          <div class="field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="activo">Activo</mat-option>
                <mat-option value="inactivo">Inactivo</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        }

        <div class="section-divider"></div>

        <div class="section-header">
          <h3>Requisitos documentales</h3>
          <button mat-stroked-button type="button" (click)="agregarRequisito()">
            <mat-icon>add</mat-icon> Agregar
          </button>
        </div>

        @if (requisitos().length === 0) {
          <div class="no-requisitos">Sin requisitos definidos</div>
        }

        @for (r of requisitos(); track r.id_requisito) {
          <div class="requisito-row">
            <div class="requisito-info">
              <span class="requisito-nombre">{{ r.nombre }}</span>
              @if (r.descripcion) {
                <span class="requisito-desc">{{ r.descripcion }}</span>
              }
            </div>
            <div class="requisito-actions">
              <mat-checkbox
                [checked]="r.obligatorio"
                (change)="toggleObligatorio(r, $event.checked)"
                color="primary">
              </mat-checkbox>
              <button mat-icon-button color="warn" (click)="eliminarRequisito(r)" matTooltip="Eliminar">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="form.invalid || isSaving()">
        @if (isSaving()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          <mat-icon>save</mat-icon>
        }
        {{ data ? 'Guardar cambios' : 'Crear modalidad' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px 0;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0d9488, #14b8a6);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon { color: white; font-size: 22px; }

    h2 { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .header-sub { margin: 2px 0 0; font-size: 0.82rem; color: #94a3b8; }

    mat-dialog-content { padding: 16px 24px; }

    .full-width { width: 100%; }

    .checkbox-row {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .section-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 16px 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 600;
      color: #475569;
    }

    .no-requisitos {
      text-align: center;
      padding: 20px;
      color: #94a3b8;
      font-size: 0.85rem;
    }

    .requisito-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 6px;
    }

    .requisito-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .requisito-nombre { font-weight: 600; font-size: 0.88rem; }
    .requisito-desc { font-size: 0.78rem; color: #94a3b8; }

    .requisito-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    mat-dialog-actions {
      padding: 12px 24px 20px;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
})
export class ModalidadFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AdminService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<ModalidadFormComponent>);

  data: ModalidadAcademicaResponse | null = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  requisitos = signal<RequisitoResponse[]>([]);
  isSaving = signal(false);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre_modalidad: [this.data?.nombre_modalidad ?? '', Validators.required],
      descripcion: [this.data?.descripcion ?? ''],
      requiere_titulo: [this.data?.requiere_titulo ?? false],
      uso_unico: [this.data?.uso_unico ?? false],
      estado: [this.data?.estado ?? 'activo'],
    });

    if (this.data) {
      this.cargarRequisitos();
    }
  }

  cargarRequisitos(): void {
    this.service.getRequisitos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: all => {
        const filtered = all.filter(r => r.id_modalidad_academica === this.data!.id_modalidad_academica);
        this.requisitos.set(filtered);
      },
    });
  }

  agregarRequisito(): void {
    const nombre = prompt('Nombre del nuevo requisito:');
    if (!nombre || !nombre.trim()) return;

    const desc = prompt('Descripción (opcional):');

    this.service.createRequisito({
      id_modalidad_academica: this.data?.id_modalidad_academica ?? null,
      nombre: nombre.trim(),
      descripcion: desc?.trim() || null,
      obligatorio: true,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        this.requisitos.update(list => [...list, r]);
        this.snackbar.open('Requisito agregado', 'Cerrar', { duration: 2000 });
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
    });
  }

  toggleObligatorio(r: RequisitoResponse, obligatorio: boolean): void {
    this.service.updateRequisito(r.id_requisito, { obligatorio }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => {
        this.requisitos.update(list => list.map(x => x.id_requisito === updated.id_requisito ? updated : x));
      },
    });
  }

  eliminarRequisito(r: RequisitoResponse): void {
    if (!confirm(`¿Eliminar requisito "${r.nombre}"?`)) return;
    this.service.deleteRequisito(r.id_requisito).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.requisitos.update(list => list.filter(x => x.id_requisito !== r.id_requisito));
        this.snackbar.open('Requisito eliminado', 'Cerrar', { duration: 2000 });
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const payload = this.form.value;

    const req = this.data
      ? this.service.updateModalidad(this.data.id_modalidad_academica, payload)
      : this.service.createModalidad(payload);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackbar.open(this.data ? 'Modalidad actualizada' : 'Modalidad creada', 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving.set(false);
        this.snackbar.open(err.error?.detail || 'Error al guardar', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
