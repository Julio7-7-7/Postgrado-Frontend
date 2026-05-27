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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { EdicionService } from '../../services/edicion.service';
import { ModalidadService } from '../../../modalidad/services/modalidad.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { ProgramaVersionEdicion, ProgramaVersionEdicionCreate } from '../../models/edicion.model';
import { Modalidad } from '../../../modalidad/models/modalidad.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-edicion-form',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-BO' },
    provideNativeDateAdapter({
      parse: { dateInput: ['DD/MM/YYYY', 'D/M/YYYY'] },
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'DD/MM/YYYY',
        monthYearA11yLabel: 'MMMM YYYY',
      },
    }),
  ],
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
    MatDialogModule,
    MatCheckboxModule,
    ConfirmDialogComponent,
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
  private dialog = inject(MatDialog);
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
  edicionesVersion = signal<ProgramaVersionEdicion[]>([]);
  esHistorico = signal(false);

  gestionSugerida = computed(() => {
    const ediciones = this.edicionesVersion().sort(
      (a, b) => b.edicion - a.edicion
    );
    const ultima = ediciones[0];
    if (!ultima?.gestion) return 'Se asignará automáticamente';

    const partes = ultima.gestion.split('-');
    if (partes.length !== 2) return 'Se asignará automáticamente';

    const mitad = parseInt(partes[0]);
    const anio = parseInt(partes[1]);

    if (mitad === 1) return `2-${anio}`;
    return `1-${anio + 1}`;
  });

  siguienteEdicion = computed(() => {
    const ediciones = this.edicionesVersion();
    if (ediciones.length === 0) return 1;
    return Math.max(...ediciones.map(e => e.edicion)) + 1;
  });

  private cargarEdicionesVersionFn = signal<boolean>(false);

  private edicionesSolapadas = computed(() => {
    const inicio = this.form.get('fecha_inicio')?.value;
    const fin = this.form.get('fecha_fin')?.value;
    if (!inicio) return [] as ProgramaVersionEdicion[];

    const dInicio = new Date(inicio).getTime();
    const dFin = fin ? new Date(fin).getTime() : dInicio;

    return this.edicionesVersion().filter(e => {
      if (this.idEditando && e.id_programa_version_edicion === this.idEditando) return false;
      if (!e.fecha_inicio) return false;
      const eInicio = new Date(e.fecha_inicio).getTime();
      const eFin = e.fecha_fin ? new Date(e.fecha_fin).getTime() : eInicio;
      return dInicio <= eFin && dFin >= eInicio;
    });
  });

  get haySolapamiento(): boolean {
    return this.edicionesSolapadas().length > 0;
  }

  get textoAdvertenciaSolapamiento(): string {
    return this.edicionesSolapadas().map(e =>
      `"${e.gestion}" (${e.fecha_inicio} – ${e.fecha_fin || '?'})`
    ).join(', ');
  }

  constructor() {
    this.form = this.fb.group({
      id_modalidad: [null, Validators.required],
      gestion: [''],
      edicion: [null],
      es_historico: [false],
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
    this.cargarEdicionesVersion(+versionId);
    this.suscribirFechaInicio();
    this.suscribirEsHistorico();

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

  private cargarEdicionesVersion(id: number) {
    this.edicionService.getAll(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.edicionesVersion.set(data);
        if (!this.idEditando) {
          this.form.patchValue({ edicion: this.siguienteEdicion() });
        }
      },
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
    if (this.esHistorico()) return true;
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
      if (this.esHistorico()) return true;
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

  private suscribirEsHistorico() {
    this.form.get('es_historico')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      this.esHistorico.set(val);
    });
  }

  errorFechaFin(): string | null {
    if (this.esHistorico()) return null;
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

  errorGestion(): string | null {
    if (this.esHistorico()) return null;
    const gestion = this.form.get('gestion')?.value;
    const fechaInicio = this.form.get('fecha_inicio')?.value;
    if (!gestion || !fechaInicio) return null;

    const partes = gestion.split('-');
    if (partes.length !== 2) return null;

    const mitad = parseInt(partes[0]);
    if (isNaN(mitad) || (mitad !== 1 && mitad !== 2)) return null;

    const mes = new Date(fechaInicio).getMonth() + 1;
    if (mitad === 1 && mes > 6) {
      return `La gestión ${gestion} corresponde al primer semestre, pero la fecha de inicio está en el segundo`;
    }
    if (mitad === 2 && mes <= 6) {
      return `La gestión ${gestion} corresponde al segundo semestre, pero la fecha de inicio está en el primero`;
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

    const errorGestion = this.errorGestion();
    if (errorGestion) {
      this.snackbar.open(errorGestion, 'Cerrar', { duration: 6000 });
      return;
    }

    if (this.haySolapamiento) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '480px',
        data: {
          titulo: 'Ediciones Solapadas',
          mensaje: `Ya existen ediciones que se solapan con las fechas seleccionadas: ${this.textoAdvertenciaSolapamiento}. ¿Desea continuar de todas formas?`,
        },
      });
      dialogRef.afterClosed().subscribe((confirmado: boolean) => {
        if (!confirmado) return;
        this.ejecutarGuardar();
      });
      return;
    }

    this.ejecutarGuardar();
  }

  private ejecutarGuardar() {
    this.loading.set(true);
    const raw = this.form.value;

    const datos: ProgramaVersionEdicionCreate = {
      id_programa_version: this.idVersion(),
      id_modalidad: raw.id_modalidad,
      es_historico: raw.es_historico || undefined,
      edicion: raw.edicion || undefined,
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
        this.router.navigate(['/programas', this.idPrograma(), 'versiones', this.idVersion(), 'ediciones'], { replaceUrl: true });
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
