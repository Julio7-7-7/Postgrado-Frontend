import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';

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
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatCardModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatAutocompleteModule, MatDividerModule,
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
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  docentes = signal<Docente[]>([]);
  detalles = signal<DetalleProgramaModulo[]>([]);
  loading = signal(false);
  loadingDatos = signal(true);

  docenteControl = new FormControl('');
  moduloControl = new FormControl('');

  selectedDocente = signal<Docente | null>(null);
  selectedModulo = signal<DetalleProgramaModulo | null>(null);

  filteredDocentes$: Observable<Docente[]> = of([]);
  filteredDetalles$: Observable<DetalleProgramaModulo[]> = of([]);

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

    this.filteredDocentes$ = this.docenteControl.valueChanges.pipe(
      startWith(''),
      debounceTime(100),
      map(value => this._filterDocentes(value ?? '')),
    );

    this.filteredDetalles$ = this.moduloControl.valueChanges.pipe(
      startWith(''),
      debounceTime(100),
      map(value => this._filterDetalles(value ?? '')),
    );
  }

  private countCargados = 0;
  private verificarCarga(): void {
    this.countCargados++;
    if (this.countCargados >= 2) {
      this.loadingDatos.set(false);

      const preSelectedId = this.route.snapshot.queryParamMap.get('id_detalle_modulo');
      if (preSelectedId) {
        const found = this.detalles().find(d => d.id_detalle_programa_modulo === +preSelectedId);
        if (found) {
          this.seleccionarModulo(found);
        }
      }
    }
  }

  private _filterDocentes(value: string): Docente[] {
    const q = value.toLowerCase().trim();
    const all = this.docentes();
    if (!q) return all.slice(0, 5);
    return all.filter(d =>
      d.nombre.toLowerCase().includes(q) ||
      d.apellido.toLowerCase().includes(q) ||
      d.ci.includes(q) ||
      `${d.nombre} ${d.apellido}`.toLowerCase().includes(q) ||
      `${d.apellido} ${d.nombre}`.toLowerCase().includes(q)
    );
  }

  private _filterDetalles(value: string): DetalleProgramaModulo[] {
    const q = value.toLowerCase().trim();
    const all = this.detalles();
    if (!q) return [];
    return all.filter(d => {
      const programa = (d.programa_nombre || '').toLowerCase();
      const modulo = d.modulo.nombre_modulo.toLowerCase();
      const sigla = d.modulo.sigla.toLowerCase();
      const version = String(d.programa_version_numero || '');
      const edicion = String(d.edicion || '');
      const label = `${programa} v${version} e${edicion} #${d.orden} ${modulo} ${sigla}`;
      return label.includes(q) ||
        modulo.includes(q) ||
        sigla.includes(q) ||
        programa.includes(q) ||
        version.includes(q) ||
        edicion.includes(q);
    });
  }

  irANuevoDocente(): void {
    this.router.navigate(['/docentes', 'nuevo']);
  }

  seleccionarDocente(d: Docente | null): void {
    if (!d) return;
    this.selectedDocente.set(d);
    this.docenteControl.setValue(`${d.nombre} ${d.apellido} — ${d.ci} ${d.extension}`);
    this.form.patchValue({ id_docente: d.id_docente });
  }

  limpiarDocente(): void {
    this.selectedDocente.set(null);
    this.docenteControl.setValue('');
    this.form.patchValue({ id_docente: null });
  }

  seleccionarModulo(d: DetalleProgramaModulo): void {
    this.selectedModulo.set(d);
    this.moduloControl.setValue(this.detalleLabel(d));
    this.form.patchValue({ id_detalle_modulo: d.id_detalle_programa_modulo });
  }

  limpiarModulo(): void {
    this.selectedModulo.set(null);
    this.moduloControl.setValue('');
    this.form.patchValue({ id_detalle_modulo: null });
  }

  detalleLabel(d: DetalleProgramaModulo): string {
    const programa = d.programa_nombre || `Programa #${d.id_programa}`;
    const version = d.programa_version_numero || d.id_programa_version;
    return `${programa} V${version} E${d.edicion} · #${d.orden} ${d.modulo.nombre_modulo} (${d.modulo.sigla})`;
  }

  guardar(): void {
    if (this.form.invalid) {
      if (!this.selectedDocente()) {
        this.docenteControl.markAsTouched();
        this.docenteControl.setErrors({ required: true });
      }
      if (!this.selectedModulo()) {
        this.moduloControl.markAsTouched();
        this.moduloControl.setErrors({ required: true });
      }
      return;
    }

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
