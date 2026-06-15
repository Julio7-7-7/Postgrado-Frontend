import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { DetalleService } from '../../services/detalle.service';
import { DocenteService } from '../../../docente/services/docente.service';
import { ModalidadService } from '../../../modalidad/services/modalidad.service';
import { HorarioService } from '../../../horario/services/horario.service';
import { Docente } from '../../../docente/models/docente.model';
import { Modalidad } from '../../../modalidad/models/modalidad.model';
import { DetalleProgramaModulo, DetalleUpdate } from '../../models/detalle.model';
import { Horario, HorarioCreate, HorarioUpdate } from '../../../horario/models/horario.model';
import { HorarioDialogComponent, HorarioDialogData } from '../../../horario/components/horario-dialog/horario-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { aFechaString } from '../../../../core/utils/date-utils';

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
    MatDatepickerModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './detalle-gestionar.html',
  styleUrl: './detalle-gestionar.css',
})
export class DetalleGestionarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private detalleService = inject(DetalleService);
  private docenteService = inject(DocenteService);
  private modalidadService = inject(ModalidadService);
  private horarioService = inject(HorarioService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  detalle = signal<DetalleProgramaModulo | null>(null);
  idEdicion = signal<number>(0);
  loading = signal(false);
  cargandoDatos = signal(true);

  docentes = signal<Docente[]>([]);
  modalidades = signal<Modalidad[]>([]);
  horarios = signal<Horario[]>([]);

  estadoOptions = [
    { value: 'programado', label: 'Programado' },
    { value: 'en_curso', label: 'En Curso' },
    { value: 'pausado', label: 'Pausado' },
    { value: 'reprogramado', label: 'Reprogramado' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  constructor() {
    this.form = this.fb.group({
      id_docente: [null],
      id_modalidad: [null],
      fecha_inicio: [null],
      fecha_fin: [null],
      estado: ['programado', Validators.required],
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

    this.cargarDocentes();
    this.cargarModalidades();
    this.cargarDetalle(+detalleId);
  }

  private cargarDocentes() {
    this.docenteService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.docentes.set(data.filter(d => d.estado === 'disponible' || d.estado === 'contratado')),
    });
  }

  private cargarModalidades() {
    this.modalidadService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.modalidades.set(data.filter(m => m.estado === 'activo')),
    });
  }

  private cargarDetalle(id: number) {
    this.cargandoDatos.set(true);
    this.detalleService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.idEdicion.set(data.id_programa_version_edicion);
        this.form.patchValue({
          id_docente: data.id_docente,
          id_modalidad: data.id_modalidad,
          fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
          fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null,
          estado: data.estado,
        });
        this.cargandoDatos.set(false);
        this.cargarHorarios();
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar datos del módulo', 'Cerrar', { duration: 4000 });
        this.volverAlCarrusel();
      },
    });
  }

  private cargarHorarios() {
    const d = this.detalle();
    if (!d) return;
    this.horarioService.getAll(d.id_detalle_programa_modulo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.horarios.set(data),
    });
  }

  necesitaMotivo(): boolean {
    return ['pausado', 'reprogramado', 'cancelado'].includes(this.form.get('estado')?.value);
  }

  guardar() {
    if (this.form.invalid || !this.detalle()) return;
    this.loading.set(true);
    const raw = this.form.value;

    const datos: DetalleUpdate = {
      id_docente: raw.id_docente ?? null,
      id_modalidad: raw.id_modalidad ?? null,
      fecha_inicio: raw.fecha_inicio ? aFechaString(raw.fecha_inicio) : null,
      fecha_fin: raw.fecha_fin ? aFechaString(raw.fecha_fin) : null,
      estado: raw.estado,
    };

    if (this.necesitaMotivo() && raw.motivo) {
      datos.motivo = raw.motivo;
    }

    this.detalleService.update(this.detalle()!.id_detalle_programa_modulo, datos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbar.open('Módulo actualizado con éxito', 'OK', { duration: 3000 });
          this.form.markAsPristine();
        },
        error: (err) => {
          this.loading.set(false);
          const detalle = err.error?.detail;
          const mensaje = Array.isArray(detalle)
            ? detalle.map((d: any) => d.msg || JSON.stringify(d)).join(' | ')
            : detalle || 'Error al actualizar';
          this.snackbar.open(mensaje, 'Cerrar', { duration: 8000 });
        },
      });
  }

  cancelarModulo() {
    const d = this.detalle();
    if (!d || d.estado === 'cancelado') return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Cancelar Módulo',
        mensaje: `¿Está seguro de cancelar "${d.modulo.sigla} — ${d.modulo.nombre_modulo}" en esta edición?`,
      },
    });
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.detalleService.cancelar(d.id_detalle_programa_modulo)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackbar.open('Módulo cancelado', 'OK', { duration: 3000 });
            this.volverAlCarrusel();
          },
          error: () => this.snackbar.open('Error al cancelar', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  agregarHorario() {
    const d = this.detalle();
    if (!d) return;
    const dialogRef = this.dialog.open(HorarioDialogComponent, {
      width: '500px',
      data: { detalleId: d.id_detalle_programa_modulo } satisfies HorarioDialogData,
    });
    dialogRef.afterClosed().subscribe((result: HorarioCreate | undefined) => {
      if (!result) return;
      result.id_detalle_programa_modulo = d.id_detalle_programa_modulo;
      this.horarioService.create(result).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.cargarHorarios();
          this.snackbar.open('Horario agregado', 'OK', { duration: 3000 });
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Error al crear horario', 'Cerrar', { duration: 5000 }),
      });
    });
  }

  editarHorario(horario: Horario) {
    const dialogRef = this.dialog.open(HorarioDialogComponent, {
      width: '500px',
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
    dialogRef.afterClosed().subscribe((result: HorarioUpdate | undefined) => {
      if (!result) return;
      this.horarioService.update(horario.id_horario, result).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.cargarHorarios();
          this.snackbar.open('Horario actualizado', 'OK', { duration: 3000 });
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Error al actualizar horario', 'Cerrar', { duration: 5000 }),
      });
    });
  }

  eliminarHorario(horario: Horario) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Eliminar Horario',
        mensaje: `¿Está seguro de eliminar el horario del ${horario.dia} ${horario.hora_ini}-${horario.hora_fin}?`,
      },
    });
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.horarioService.cancelar(horario.id_horario).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.cargarHorarios();
          this.snackbar.open('Horario eliminado', 'OK', { duration: 3000 });
        },
        error: () => this.snackbar.open('Error al eliminar horario', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  diaLabel(dia: string): string {
    const map: Record<string, string> = {
      lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
      jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
    };
    return map[dia] || dia;
  }

  volverAlCarrusel() {
    const base = this.router.url.replace(/\/gestionar\/\d+.*/, '');
    this.router.navigate([base], { replaceUrl: true });
  }
}
