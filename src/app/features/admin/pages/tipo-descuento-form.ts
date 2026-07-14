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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import {
  TipoDescuentoResponse,
  ModalidadAcademicaResponse,
  RequisitoResponse,
} from '../models/admin.models';

@Component({
  selector: 'app-tipo-descuento-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatSelectModule, MatChipsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>{{ data ? 'edit' : 'add' }}</mat-icon>
      </div>
      <div>
        <h2 mat-dialog-title>{{ data ? 'Editar Descuento' : 'Nuevo Descuento' }}</h2>
        <p class="header-sub">{{ data ? 'Modificá los datos del descuento' : 'Creá un nuevo tipo de descuento o beca' }}</p>
      </div>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej: Beca 100% por Excelente Desempeño">
            @if (form.get('nombre')?.hasError('required')) {
              <mat-error>El nombre es obligatorio</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="field-row">
          <mat-form-field appearance="outline" class="half">
            <mat-label>Porcentaje (%)</mat-label>
            <input matInput type="number" formControlName="porcentaje" min="1" max="100">
            @if (form.get('porcentaje')?.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            }
            @if (form.get('porcentaje')?.hasError('min') || form.get('porcentaje')?.hasError('max')) {
              <mat-error>Entre 1 y 100</mat-error>
            }
          </mat-form-field>

          @if (data) {
            <mat-form-field appearance="outline" class="half">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="activo">Activo</mat-option>
                <mat-option value="inactivo">Inactivo</mat-option>
              </mat-select>
            </mat-form-field>
          }
        </div>

        <div class="field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="descripcion" rows="2" placeholder="Descripción del descuento..."></textarea>
          </mat-form-field>
        </div>

        <div class="checkbox-row">
          <mat-checkbox formControlName="uso_unico">Uso único (el alumno puede usarlo solo una vez en su vida)</mat-checkbox>
        </div>

        <div class="section-divider"></div>

        <div class="section-header">
          <h3>Modalidades donde aplica</h3>
        </div>
        <p class="section-hint">Si no seleccionás ninguna, aplica a todas las modalidades</p>
        <div class="chips-container">
          @for (mod of modalidades(); track mod.id_modalidad_academica) {
            <div class="chip-option"
                 [class.selected]="selectedModalidades().has(mod.id_modalidad_academica)"
                 (click)="toggleModalidad(mod.id_modalidad_academica)">
              <mat-icon>{{ selectedModalidades().has(mod.id_modalidad_academica) ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
              <span>{{ mod.nombre_modalidad }}</span>
            </div>
          }
        </div>

        <div class="section-divider"></div>

        <div class="section-header">
          <h3>Documentos requeridos para este descuento</h3>
        </div>
        <p class="section-hint">Estos requisitos se suman a los de la modalidad elegida por el alumno</p>
        <div class="chips-container">
          @for (req of requisitosDisponibles(); track req.id_requisito) {
            <div class="chip-option"
                 [class.selected]="selectedRequisitos().has(req.id_requisito)"
                 (click)="toggleRequisito(req.id_requisito)">
              <mat-icon>{{ selectedRequisitos().has(req.id_requisito) ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
              <span>{{ req.nombre }}</span>
              @if (req.modalidad_academica) {
                <span class="chip-hint">{{ req.modalidad_academica.nombre_modalidad }}</span>
              } @else {
                <span class="chip-hint global">Global</span>
              }
            </div>
          }
        </div>
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
        {{ data ? 'Guardar cambios' : 'Crear descuento' }}
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
      background: linear-gradient(135deg, #b45309, #f59e0b);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon { color: white; font-size: 22px; }

    h2 { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .header-sub { margin: 2px 0 0; font-size: 0.82rem; color: #94a3b8; }

    mat-dialog-content { padding: 16px 24px; max-height: 65vh; }

    .full-width { width: 100%; }
    .half { width: 48%; }
    .field-row { display: flex; gap: 12px; }

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
      margin-bottom: 4px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 600;
      color: #475569;
    }

    .section-hint {
      margin: 0 0 12px;
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .chips-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }

    .chip-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 0.88rem;
    }

    .chip-option:hover { background: #f8fafc; border-color: #c7d2fe; }

    .chip-option.selected {
      background: #eef2ff;
      border-color: #6366f1;
      color: #4338ca;
    }

    .chip-option mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .chip-hint {
      margin-left: auto;
      font-size: 0.72rem;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .chip-hint.global { background: #fef3c7; color: #92400e; }

    mat-dialog-actions {
      padding: 12px 24px 20px;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
})
export class TipoDescuentoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AdminService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<TipoDescuentoFormComponent>);

  data: TipoDescuentoResponse | null = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  modalidades = signal<ModalidadAcademicaResponse[]>([]);
  requisitosAll = signal<RequisitoResponse[]>([]);
  selectedModalidades = signal<Set<number>>(new Set());
  selectedRequisitos = signal<Set<number>>(new Set());
  isSaving = signal(false);

  requisitosDisponibles = signal<RequisitoResponse[]>([]);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.data?.nombre ?? '', Validators.required],
      porcentaje: [this.data?.porcentaje ?? 50, [Validators.required, Validators.min(1), Validators.max(100)]],
      descripcion: [this.data?.descripcion ?? ''],
      uso_unico: [this.data?.uso_unico ?? false],
      estado: [this.data?.estado ?? 'activo'],
    });

    this.service.getModalidades().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.modalidades.set(data);
        if (this.data) {
          const ids = new Set(this.data.modalidades.map(m => m.id_modalidad_academica));
          this.selectedModalidades.set(ids);
        }
      },
    });

    this.service.getRequisitos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.requisitosAll.set(data);
        this.requisitosDisponibles.set(data);
        if (this.data) {
          const ids = new Set(this.data.requisitos.map(r => r.id_requisito));
          this.selectedRequisitos.set(ids);
        }
      },
    });
  }

  toggleModalidad(id: number): void {
    this.selectedModalidades.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleRequisito(id: number): void {
    this.selectedRequisitos.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const payload = {
      ...this.form.value,
      modalidades: Array.from(this.selectedModalidades()),
      requisitos: Array.from(this.selectedRequisitos()),
    };

    const req = this.data
      ? this.service.updateTipoDescuento(this.data.id_tipo_descuento, payload)
      : this.service.createTipoDescuento(payload);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackbar.open(this.data ? 'Descuento actualizado' : 'Descuento creado', 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving.set(false);
        this.snackbar.open(err.error?.detail || 'Error al guardar', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
