import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { EdicionService } from '../../services/edicion.service';
import { ModalidadService } from '../../../modalidad/services/modalidad.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { ProgramaVersionEdicionCreate } from '../../models/edicion.model';
import { Modalidad } from '../../../modalidad/models/modalidad.model';

@Component({
  selector: 'app-edicion-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
  ],
  templateUrl: './edicion-form.html',
  styleUrl: './edicion-form.css',
})
export class EdicionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private edicionService = inject(EdicionService);
  private modalidadService = inject(ModalidadService);
  private versionService = inject(ProgramaVersionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  idPrograma = signal<number>(0);
  idVersion = signal<number>(0);
  idEditando: number | null = null;
  loading = signal(false);
  cargandoDatos = signal(false);
  modalidades = signal<Modalidad[]>([]);
  infoVersion = signal('');
  duracionMinimaMeses = signal<number | null>(null);
  tipoNombre = signal('');
  hoy = new Date();

  constructor() {
    this.form = this.fb.group({
      id_modalidad: [null, Validators.required],
      gestion: [''],
      estado: ['programado', Validators.required],
      fecha_inicio: [null],
      fecha_fin: [null],
      cupo_maximo: [null, [Validators.min(1)]],
      descripcion: ['', [Validators.maxLength(500)]],
      precio: [null, [Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    const versionId = this.route.parent?.snapshot.paramMap.get('versionId');
    const programaId = this.route.parent?.parent?.snapshot.paramMap.get('id');

    if (!versionId) {
      this.snackbar.open('Versión no especificada', 'Cerrar', { duration: 4000 });
      this.router.navigate(['/programas']);
      return;
    }

    this.idVersion.set(+versionId);
    this.idPrograma.set(programaId ? +programaId : 0);
    this.cargarModalidades();
    this.cargarVersion(+versionId);
    this.suscribirFechaInicio();

    const edicionId = this.route.snapshot.paramMap.get('edicionId');
    if (edicionId) {
      this.idEditando = +edicionId;
      this.cargarDatosParaEditar(this.idEditando);
    }
  }

  private cargarModalidades() {
    this.modalidadService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.modalidades.set(data.filter(m => m.estado === 'activo')),
    });
  }

  private cargarVersion(id: number) {
    this.versionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.infoVersion.set(`${data.programa.nombre_programa} — v${data.version}`);
        const tipo = data.programa.tipo_programa;
        this.duracionMinimaMeses.set(tipo.duracion_minima_meses);
        this.tipoNombre.set(tipo.nombre);
      },
      error: () => this.router.navigate(['/programas']),
    });
  }

  private cargarDatosParaEditar(id: number) {
    this.cargandoDatos.set(true);
    this.edicionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.fechaInicioValor.set(data.fecha_inicio ? new Date(data.fecha_inicio) : null);
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar la edición', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/programas', this.idPrograma(), 'versiones', this.idVersion(), 'ediciones']);
      },
    });
  }

  filtroFechaInicio = (f: Date | null): boolean => {
    if (!f) return true;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return f >= hoy;
  };

  fechaInicioValor = signal<Date | null>(null);

  filtroFechaFin = computed(() => {
    const inicio = this.fechaInicioValor();
    const meses = this.duracionMinimaMeses();

    return (f: Date | null): boolean => {
      if (!f) return false;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (f < hoy) return false;

      if (inicio && meses) {
        const minFin = new Date(inicio);
        minFin.setMonth(minFin.getMonth() + meses);
        if (f < minFin) return false;
      }

      return true;
    };
  });

  private suscribirFechaInicio() {
    this.form.get('fecha_inicio')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      this.fechaInicioValor.set(val);
    });
  }

  errorFechaFin(): string | null {
    const inicio = this.form.get('fecha_inicio')?.value;
    const fin = this.form.get('fecha_fin')?.value;
    const meses = this.duracionMinimaMeses();

    if (!inicio || !fin || !meses) return null;

    const dInicio = new Date(inicio);
    const dFin = new Date(fin);
    if (dFin <= dInicio) return 'La fecha de fin debe ser posterior a la fecha de inicio';

    const diffMeses = (dFin.getFullYear() - dInicio.getFullYear()) * 12
      + (dFin.getMonth() - dInicio.getMonth());
    const diffDias = diffMeses * 30 + (dFin.getDate() - dInicio.getDate());

    if (diffDias < meses * 30) {
      return `Duración mínima: ${meses} mes(es) para ${this.tipoNombre()}`;
    }
    return null;
  }

  guardar() {
    if (this.form.invalid) return;

    const errorFechas = this.errorFechaFin();
    if (errorFechas) {
      this.snackbar.open(errorFechas, 'Cerrar', { duration: 6000 });
      return;
    }

    this.loading.set(true);
    const raw = this.form.value;

    const datos: ProgramaVersionEdicionCreate = {
      id_programa_version: this.idVersion(),
      id_modalidad: raw.id_modalidad,
      estado: raw.estado,
      gestion: raw.gestion || undefined,
      fecha_inicio: raw.fecha_inicio ? this.aFechaString(raw.fecha_inicio) : null,
      fecha_fin: raw.fecha_fin ? this.aFechaString(raw.fecha_fin) : null,
      cupo_maximo: raw.cupo_maximo ?? undefined,
      descripcion: raw.descripcion || null,
      precio: raw.precio ?? undefined,
    };

    const peticion = this.idEditando
      ? this.edicionService.update(this.idEditando, datos)
      : this.edicionService.create(datos);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        const mensaje = this.idEditando ? 'Edición actualizada con éxito' : 'Edición creada con éxito';
        this.snackbar.open(mensaje, 'OK', { duration: 3000 });
        this.router.navigate(['/programas', this.idPrograma(), 'versiones', this.idVersion(), 'ediciones']);
      },
      error: (err) => {
        this.loading.set(false);
        const detalle = err.error?.detail;
        const mensaje = Array.isArray(detalle)
          ? detalle.map((d: any) => d.msg || JSON.stringify(d)).join(' | ')
          : detalle || 'Ocurrió un error al procesar la solicitud';
        this.snackbar.open(mensaje, 'Cerrar', { duration: 8000 });
      },
    });
  }

  private aFechaString(fecha: Date | null): string | null {
    if (!fecha) return null;
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }
}
