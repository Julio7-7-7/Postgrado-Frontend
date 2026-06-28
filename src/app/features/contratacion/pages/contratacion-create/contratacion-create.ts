import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ContratacionService } from '../../services/contratacion.service';
import { DocenteService } from '../../../docente/services/docente.service';
import { DetalleService } from '../../../detalle-programa-modulo/services/detalle.service';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';
import { Docente } from '../../../docente/models/docente.model';

@Component({
  selector: 'app-contratacion-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './contratacion-create.html',
  styleUrl: './contratacion-create.css',
})
export class ContratacionCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ContratacionService);
  private docenteService = inject(DocenteService);
  private detalleService = inject(DetalleService);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  docentes = signal<Docente[]>([]);
  detalles = signal<DetalleProgramaModulo[]>([]);
  loading = signal(false);
  loadingDatos = signal(true);

  constructor() {
    this.form = this.fb.group({
      id_docente: [null, Validators.required],
      id_detalle_modulo: [null, Validators.required],
      monto: [null],
    });
  }

  ngOnInit(): void {
    this.docenteService.getAll('activo').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.docentes.set(data);
        this.verificarCarga();
      },
    });

    this.detalleService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalles.set(data);
        this.verificarCarga();
      },
    });
  }

  private countCargados = 0;
  private verificarCarga(): void {
    this.countCargados++;
    if (this.countCargados >= 2) {
      this.loadingDatos.set(false);
    }
  }

  detalleLabel(d: DetalleProgramaModulo): string {
    return `#${d.orden} - ${d.modulo.nombre_modulo} (${d.modulo.sigla})`;
  }

  guardar(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.service.create(this.form.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.snackbar.open('Contratación creada correctamente', 'OK', { duration: 3000 });
        this.router.navigate(['/contrataciones', res.id_contratacion]);
      },
      error: (err) => {
        this.snackbar.open(err.error?.detail || 'Error al crear contratación', 'Cerrar', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }
}
