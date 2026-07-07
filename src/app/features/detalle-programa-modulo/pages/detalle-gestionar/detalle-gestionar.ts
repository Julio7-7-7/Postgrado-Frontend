import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { DetalleService } from '../../services/detalle.service';
import { HorarioService } from '../../../horario/services/horario.service';
import { DetalleProgramaModulo, DetalleUpdate } from '../../models/detalle.model';
import { Horario, HorarioCreate, HorarioUpdate } from '../../../horario/models/horario.model';
import { HorarioDialogComponent, HorarioDialogData } from '../../../horario/components/horario-dialog/horario-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ConfirmCambiosDialogComponent, ConfirmCambiosData, CambioResumen } from '../../../../shared/components/confirm-cambios-dialog/confirm-cambios-dialog';
import { aFechaString, aFechaDisplay, isoAString } from '../../../../core/utils/date-utils';

interface PendingCreate { type: 'crear'; tempId: number; data: HorarioCreate; }
interface PendingUpdate { type: 'actualizar'; id: number; data: HorarioUpdate; }
interface PendingDelete { type: 'eliminar'; id: number; }
interface PendingReactivar { type: 'reactivar'; id: number; }
type PendingAction = PendingCreate | PendingUpdate | PendingDelete | PendingReactivar;

@Component({
  selector: 'app-detalle-gestionar',
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
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatRadioModule, MatDatepickerModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDividerModule, MatDialogModule,
  ],
  templateUrl: './detalle-gestionar.html',
  styleUrl: './detalle-gestionar.css',
})
export class DetalleGestionarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private detalleService = inject(DetalleService);
  private horarioService = inject(HorarioService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private readonly DURACION_MINIMA_DIAS = 30;
  private readonly ESTADO_TRANSICIONES: Record<string, string[]> = {
    programado: ['en_curso'],
    en_curso: ['reprogramado', 'finalizado'],
    reprogramado: ['en_curso'],
    finalizado: [],
  };

  fechaFinManual = false;

  form: FormGroup;
  detalle = signal<DetalleProgramaModulo | null>(null);
  hermanos = signal<DetalleProgramaModulo[]>([]);
  cargandoDatos = signal(true);
  horarios = signal<Horario[]>([]);
  pendingActions = signal<PendingAction[]>([]);
  saving = signal(false);

  /** Fecha mínima para fecha_inicio (edición + hermano anterior) */
  minFechaInicio = computed<Date | null>(() => {
    const d = this.detalle();
    if (!d) return null;
    const edStart = d.fecha_inicio_edicion ? this.parseDate(d.fecha_inicio_edicion) : null;
    const prevEnd = this.fechaFinHermanoAnterior();
    if (edStart && prevEnd) return edStart > prevEnd ? edStart : prevEnd;
    return edStart || prevEnd || null;
  });

  /** Fecha máxima para fecha_inicio (no después del fin de edición) */
  maxFechaInicio = computed<Date | null>(() => {
    const d = this.detalle();
    return d?.fecha_fin_edicion ? this.parseDate(d.fecha_fin_edicion) : null;
  });

  /** Fecha máxima para fecha_fin (edición + hermano siguiente) */
  maxFechaFin = computed<Date | null>(() => {
    const d = this.detalle();
    const edEnd = d?.fecha_fin_edicion ? this.parseDate(d.fecha_fin_edicion) : null;
    const nextStart = this.fechaInicioHermanoSiguiente();
    if (edEnd && nextStart) return edEnd < nextStart ? edEnd : nextStart;
    return edEnd || nextStart || null;
  });

  private fechaFinHermanoAnterior(): Date | null {
    const d = this.detalle();
    if (!d) return null;
    const anterior = this.hermanos()
      .filter(h => h.orden < d.orden && h.fecha_fin)
      .sort((a, b) => b.orden - a.orden)[0];
    if (!anterior?.fecha_fin) return null;
    const fin = new Date(anterior.fecha_fin);
    fin.setDate(fin.getDate() + 1);
    return fin;
  }

  private fechaInicioHermanoSiguiente(): Date | null {
    const d = this.detalle();
    if (!d) return null;
    const siguiente = this.hermanos()
      .filter(h => h.orden > d.orden && h.fecha_inicio)
      .sort((a, b) => a.orden - b.orden)[0];
    if (!siguiente?.fecha_inicio) return null;
    const inicio = new Date(siguiente.fecha_inicio);
    inicio.setDate(inicio.getDate() - 1);
    return inicio;
  }

  private parseDate(s: string | null): Date | null {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  horariosVisibles = computed(() => {
    const base = this.horarios();
    const actions = this.pendingActions();

    const deletedIds = new Set(
      actions.filter(a => a.type === 'eliminar').map(a => (a as PendingDelete).id)
    );

    const updates = new Map<number, Partial<Horario>>();
    for (const a of actions) {
      if (a.type === 'actualizar') updates.set(a.id, { ...(a as PendingUpdate).data } as any);
      if (a.type === 'reactivar') {
        const prev = updates.get(a.id) || {};
        updates.set(a.id, { ...prev, estado: 'activo' });
      }
    }

    const items: Horario[] = base
      .filter(h => !deletedIds.has(h.id_horario))
      .map(h => {
        const upd = updates.get(h.id_horario);
        return upd ? { ...h, ...upd } : h;
      });

    for (const a of actions) {
      if (a.type === 'crear') {
        const c = a as PendingCreate;
        items.push({
          id_horario: c.tempId,
          id_detalle_programa_modulo: c.data.id_detalle_programa_modulo,
          dia: c.data.dia,
          hora_ini: c.data.hora_ini,
          hora_fin: c.data.hora_fin,
          aula: c.data.aula ?? null,
          estado: 'activo',
          created_at: '',
          updated_at: '',
        });
      }
    }

    const ORDEN_DIAS: Record<string, number> = {
      lunes: 1, martes: 2, miercoles: 3, jueves: 4,
      viernes: 5, sabado: 6, domingo: 7,
    };
    return items.sort((a, b) => (ORDEN_DIAS[a.dia] ?? 99) - (ORDEN_DIAS[b.dia] ?? 99));
  });

  horariosChanged = computed(() => this.pendingActions().length > 0);

  estadoOriginal = '';
  fechaInicioOriginal: string | null = null;
  fechaFinOriginal: string | null = null;

  estadosDisponibles = computed(() => {
    const d = this.detalle();
    if (!d) return [];
    const permitidos = this.ESTADO_TRANSICIONES[d.estado] ?? [];
    const fechasModificadas = this.estadoOriginal === 'en_curso' && this.fechasChanged;
    return [
      {
        value: d.estado,
        label: this.etiquetaEstado(d.estado),
        actual: true,
        disabled: fechasModificadas && d.estado === 'en_curso',
      },
      ...permitidos.map(v => ({
        value: v,
        label: this.etiquetaEstado(v),
        actual: false,
        disabled: false,
      })),
    ];
  });

  get estadoChanged(): boolean {
    return this.form.value.nuevo_estado !== this.estadoOriginal;
  }

  get fechasChanged(): boolean {
    const v = this.form.value;
    return aFechaString(v.fecha_inicio) !== this.fechaInicioOriginal
        || aFechaString(v.fecha_fin) !== this.fechaFinOriginal;
  }

  get tieneCambiosDetalle(): boolean {
    return this.estadoChanged || this.fechasChanged;
  }

  get tieneCambios(): boolean {
    return this.tieneCambiosDetalle || this.horariosChanged();
  }

  get motivoRequerido(): boolean {
    return this.tieneCambiosDetalle;
  }

  get puedeGuardar(): boolean {
    if (!this.tieneCambios || this.saving()) return false;
    if (!this.motivoRequerido) return true;
    const mot = this.form.get('motivo')?.value || '';
    return mot.length >= 5;
  }

  constructor() {
    this.form = this.fb.group({
      nuevo_estado: ['', Validators.required],
      fecha_inicio: [null],
      fecha_fin: [null],
      motivo: [''],
    });
  }

  ngOnInit(): void {
    const detalleId = this.route.snapshot.paramMap.get('detalleId');
    if (!detalleId) {
      this.snackbar.open('Detalle no especificado', 'Cerrar', { duration: 4000 });
      this.volverAlCarrusel();
      return;
    }
    this.cargarDetalle(+detalleId);
  }

  private cargarDetalle(id: number) {
    this.cargandoDatos.set(true);
    this.detalleService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.estadoOriginal = data.estado;
        this.fechaInicioOriginal = data.fecha_inicio;
        this.fechaFinOriginal = data.fecha_fin;
        this.form.patchValue({
          nuevo_estado: data.estado,
          fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
          fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null,
          motivo: '',
        });
        this.fechaFinManual = false;
        this.cargarHorarios();
        this.cargarHermanos(data.id_programa_version_edicion);
        this.configurarListeners();
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar datos del módulo', 'Cerrar', { duration: 4000 });
        this.volverAlCarrusel();
      },
    });
  }

  private cargarHermanos(edicionId: number) {
    this.detalleService.getAll(edicionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (modulos) => this.hermanos.set(modulos),
    });
  }

  private cargarHorarios() {
    const d = this.detalle();
    if (!d) return;
    this.horarioService.getAll(d.id_detalle_programa_modulo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.horarios.set(data),
        error: () => this.snackbar.open('Error al cargar horarios', 'Cerrar', { duration: 3000 }),
      });
  }

  private configurarListeners() {
    this.form.get('nuevo_estado')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(estado => {
        if (estado === 'en_curso' && estado !== this.estadoOriginal) {
          this.autoFillFechas();
        }
      });

    this.form.get('fecha_inicio')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.ajustarFechaFin();
        if (this.estadoOriginal === 'en_curso' && this.fechasChanged
            && this.form.value.nuevo_estado !== 'reprogramado') {
          this.form.patchValue({ nuevo_estado: 'reprogramado' }, { emitEvent: false });
        }
      });

    this.form.get('fecha_fin')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.estadoOriginal === 'en_curso' && this.fechasChanged
            && this.form.value.nuevo_estado !== 'reprogramado') {
          this.form.patchValue({ nuevo_estado: 'reprogramado' }, { emitEvent: false });
        }
      });
  }

  private autoFillFechas() {
    const fiControl = this.form.get('fecha_inicio');
    const ffControl = this.form.get('fecha_fin');
    const min = this.minFechaInicio();
    let inicio = new Date();
    if (min && inicio < min) inicio = new Date(min);
    const maxInicio = this.maxFechaInicio();
    if (maxInicio && inicio > maxInicio) inicio = new Date(maxInicio);
    fiControl?.setValue(inicio);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + this.DURACION_MINIMA_DIAS);
    const maxFin = this.maxFechaFin();
    if (maxFin && fin > maxFin) fin.setTime(maxFin.getTime());
    ffControl?.setValue(fin, { emitEvent: false });
    this.fechaFinManual = false;
  }

  private ajustarFechaFin() {
    const fi = this.form.get('fecha_inicio')?.value;
    const ff = this.form.get('fecha_fin')?.value;
    if (!fi || !ff) return;
    const diff = Math.round((ff.getTime() - fi.getTime()) / 86400000);
    if (diff < this.DURACION_MINIMA_DIAS) {
      let nuevoFin = new Date(fi);
      nuevoFin.setDate(nuevoFin.getDate() + this.DURACION_MINIMA_DIAS);
      const maxFin = this.maxFechaFin();
      if (maxFin && nuevoFin > maxFin) nuevoFin = new Date(maxFin);
      this.form.get('fecha_fin')?.setValue(nuevoFin, { emitEvent: false });
      this.fechaFinManual = false;
    }
  }

  marcarFechaFinManual() {
    this.fechaFinManual = true;
  }

  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado', en_curso: 'En Curso',
      reprogramado: 'Reprogramado', finalizado: 'Finalizado',
    };
    return map[estado] || estado;
  }

  diaLabel(dia: string): string {
    const map: Record<string, string> = {
      lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
      jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
    };
    return map[dia] || dia;
  }

  private buildPatch(): DetalleUpdate {
    const patch: DetalleUpdate = {};
    if (this.estadoChanged) {
      patch.estado = this.form.value.nuevo_estado;
    }
    if (this.fechasChanged) {
      patch.fecha_inicio = this.form.value.fecha_inicio
        ? aFechaString(this.form.value.fecha_inicio) : null;
      patch.fecha_fin = this.form.value.fecha_fin
        ? aFechaString(this.form.value.fecha_fin) : null;
    }
    patch.motivo = this.form.value.motivo;
    return patch;
  }

  private flushHorarios() {
    const pending = this.pendingActions();
    if (pending.length === 0) return of(null);

    const observables = pending.map(a => {
      if (a.type === 'crear') return this.horarioService.create(a.data);
      if (a.type === 'actualizar') return this.horarioService.update(a.id, a.data);
      if (a.type === 'eliminar') return this.horarioService.cancelar(a.id);
      if (a.type === 'reactivar') return this.horarioService.update(a.id, { estado: 'activo' });
      return of(null);
    });

    return forkJoin(observables);
  }

  guardar() {
    if (!this.puedeGuardar) return;

    if (this.tieneCambiosDetalle) {
      const dialogRef = this.dialog.open(ConfirmCambiosDialogComponent, {
        width: '480px',
        data: this.buildConfirmData(),
      });
      dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmado => {
        if (!confirmado) return;
        this.ejecutarGuardar();
      });
    } else {
      this.ejecutarGuardar();
    }
  }

  private buildConfirmData(): ConfirmCambiosData {
    const d = this.detalle()!;
    const cambios: CambioResumen[] = [];

    if (this.estadoChanged) {
      cambios.push({
        campo: 'Estado',
        antes: this.etiquetaEstado(this.estadoOriginal),
        despues: this.etiquetaEstado(this.form.value.nuevo_estado),
      });
    }
    if (this.fechasChanged) {
      const fi = this.form.value.fecha_inicio;
      const ff = this.form.value.fecha_fin;
      cambios.push({
        campo: 'Inicio',
        antes: isoAString(this.fechaInicioOriginal),
        despues: fi ? aFechaDisplay(fi) : '—',
      });
      cambios.push({
        campo: 'Fin',
        antes: isoAString(this.fechaFinOriginal),
        despues: ff ? aFechaDisplay(ff) : '—',
      });
    }

    return {
      modulo: d.modulo.nombre_modulo,
      sigla: d.modulo.sigla,
      programa: d.programa_nombre,
      version: d.programa_version_numero,
      edicion: d.edicion,
      orden: d.orden,
      modalidad: d.modalidad ? d.modalidad.charAt(0).toUpperCase() + d.modalidad.slice(1) : null,
      docente: d.docente ? `${d.docente.nombre} ${d.docente.apellido}` : null,
      cambios,
    };
  }

  private ejecutarGuardar() {
    this.saving.set(true);

    const d = this.detalle();
    if (!d) return;

    const flush$ = this.flushHorarios();
    const detalle$ = this.tieneCambiosDetalle
      ? this.detalleService.update(d.id_detalle_programa_modulo, this.buildPatch())
      : of(null);

    forkJoin({ detalle: detalle$, horarios: flush$ })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingActions.set([]);
          this.saving.set(false);
          this.snackbar.open('Cambios guardados con éxito', 'OK', { duration: 3000 });
          if (this.tieneCambiosDetalle) {
            this.cargarDetalle(d.id_detalle_programa_modulo);
          } else {
            this.volverAlCarrusel();
          }
        },
        error: (err) => this.manejarError(err),
      });
  }

  private manejarError(err: any) {
    this.saving.set(false);
    const detalle = err.error?.detail;
    const mensaje = Array.isArray(detalle)
      ? detalle.map((d: any) => d.msg || JSON.stringify(d)).join(' | ')
      : detalle || 'Error al actualizar';
    this.snackbar.open(mensaje, 'Cerrar', { duration: 8000 });
  }

  agregarHorario() {
    const d = this.detalle();
    if (!d) return;
    const subRef = this.dialog.open(HorarioDialogComponent, {
      width: '760px',
      data: { detalleId: d.id_detalle_programa_modulo } satisfies HorarioDialogData,
    });
    subRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: HorarioCreate | undefined) => {
      if (!result) return;
      result.id_detalle_programa_modulo = d.id_detalle_programa_modulo;
      this.pendingActions.update(prev => [...prev, {
        type: 'crear',
        tempId: Date.now() + Math.random(),
        data: result,
      }]);
    });
  }

  editarHorario(horario: Horario) {
    const subRef = this.dialog.open(HorarioDialogComponent, {
      width: '760px',
      data: {
        detalleId: horario.id_detalle_programa_modulo,
        horario: {
          id: horario.id_horario,
          dia: horario.dia,
          hora_ini: horario.hora_ini,
          hora_fin: horario.hora_fin,
          aula: horario.aula,
        },
      } satisfies HorarioDialogData,
    });
    subRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: HorarioUpdate | undefined) => {
      if (!result) return;
      this.pendingActions.update(prev => [...prev, {
        type: 'actualizar',
        id: horario.id_horario,
        data: result,
      }]);
    });
  }

  eliminarHorario(horario: Horario) {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Eliminar Horario',
        mensaje: `¿Está seguro de eliminar el horario del ${this.diaLabel(horario.dia)} ${horario.hora_ini}-${horario.hora_fin}?`,
      },
    });
    confirmRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.pendingActions.update(prev => [...prev, { type: 'eliminar', id: horario.id_horario }]);
    });
  }

  reactivarHorario(horario: Horario) {
    this.pendingActions.update(prev => [...prev, { type: 'reactivar', id: horario.id_horario }]);
  }

  verHistorial() {
    const d = this.detalle();
    if (!d) return;
    const base = this.router.url.replace(/\/gestionar\/\d+/, '/modulos');
    this.router.navigate([`${base}/historial/${d.id_detalle_programa_modulo}`]);
  }

  volverAlCarrusel() {
    const base = this.router.url.replace(/\/gestionar\/\d+.*/, '');
    this.router.navigate([base], { replaceUrl: true });
  }
}
