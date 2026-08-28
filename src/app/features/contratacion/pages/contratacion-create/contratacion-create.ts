import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { ProgramaService } from '../../../programa/services/programa.service';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';
import { Docente } from '../../../docente/models/docente.model';
import { Programa } from '../../../programa/models/programa.model';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';

@Component({
  selector: 'app-contratacion-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
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
  private programaService = inject(ProgramaService);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private navBack = inject(NavigationBackService);

  form: FormGroup;
  programas = signal<Programa[]>([]);
  docentes = signal<Docente[]>([]);
  detalles = signal<DetalleProgramaModulo[]>([]);
  loading = signal(false);
  loadingDatos = signal(true);

  programaControl = new FormControl('');
  docenteControl = new FormControl('');
  moduloControl = new FormControl('');

  selectedPrograma = signal<Programa | null>(null);
  selectedDocente = signal<Docente | null>(null);
  selectedModulo = signal<DetalleProgramaModulo | null>(null);

  filteredProgramas$: Observable<Programa[]> = of([]);
  filteredDocentes$: Observable<Docente[]> = of([]);

  constructor() {
    this.form = this.fb.group({
      id_docente: [null, Validators.required],
      id_detalle_modulo: [null, Validators.required],
      monto: [null],
    });
  }

  ngOnInit(): void {
    this.programaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.programas.set(data.filter(p => p.estado === 'activo'));
        this.verificarCarga();
      },
    });

    this.docenteService.getAll('activo').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.docentes.set(data);
        this.verificarCarga();
      },
    });

    this.filteredProgramas$ = this.programaControl.valueChanges.pipe(
      startWith(''),
      debounceTime(100),
      map(value => this._filterProgramas(value ?? '')),
    );

    this.filteredDocentes$ = this.docenteControl.valueChanges.pipe(
      startWith(''),
      debounceTime(100),
      map(value => this._filterDocentes(value ?? '')),
    );
  }

  private countCargados = 0;
  private verificarCarga(): void {
    this.countCargados++;
    if (this.countCargados >= 2) {
      this.loadingDatos.set(false);

      const preSelectedId = this.route.snapshot.queryParamMap.get('id_detalle_modulo');
      if (preSelectedId) {
        this.detalleService.getById(+preSelectedId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (d) => {
            this.seleccionarProgramaPorId(d.id_programa, () => this.seleccionarModulo(d));
          },
        });
      }
    }
  }

  private seleccionarProgramaPorId(id: number, luego?: () => void): void {
    const p = this.programas().find(p => p.id_programa === id);
    if (p) {
      this.seleccionarPrograma(p, luego);
    }
  }

  private _filterProgramas(value: string): Programa[] {
    const q = value.toLowerCase().trim();
    const all = this.programas();
    if (!q) return all.slice(0, 5);
    return all.filter(p =>
      p.nombre_programa.toLowerCase().includes(q)
    );
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

  seleccionarPrograma(p: Programa | null, luego?: () => void): void {
    if (!p) return;
    this.selectedPrograma.set(p);
    this.programaControl.setValue(p.nombre_programa);
    this.limpiarModulo();
    this.cargarModulos(p.id_programa, luego);
  }

  limpiarPrograma(): void {
    this.selectedPrograma.set(null);
    this.programaControl.setValue('');
    this.detalles.set([]);
    this.limpiarModulo();
  }

  private cargarModulos(programaId: number, luego?: () => void): void {
    this.detalleService.getAll(undefined, programaId, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalles.set(data);
        if (luego) luego();
      },
    });
  }

  filteredDetalles(): DetalleProgramaModulo[] {
    const q = (this.moduloControl.value ?? '').toLowerCase().trim();
    const all = this.detalles();
    if (!q) return all.slice(0, 10);
    return all.filter(d => {
      const label = this.searchLabel(d);
      return label.includes(q);
    });
  }

  private searchLabel(d: DetalleProgramaModulo): string {
    return [
      d.modulo.nombre_modulo,
      d.modulo.sigla,
      `V${d.programa_version_numero}`,
      `E${d.edicion}`,
      `#${d.orden}`,
    ].join(' ').toLowerCase();
  }

  irANuevoDocente(): void {
    this.router.navigate(['/docentes', 'nuevo']);
  }

  cancelar(): void {
    this.navBack.retornar(['/contrataciones']);
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
    return `V${d.programa_version_numero} E${d.edicion} · #${d.orden} ${d.modulo.nombre_modulo} (${d.modulo.sigla})`;
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
