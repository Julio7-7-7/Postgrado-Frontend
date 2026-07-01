import { Component, Inject, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DetalleProgramaModulo, DetalleUpdate } from '../../models/detalle.model';
import { DetalleService } from '../../services/detalle.service';
import { Horario, HorarioCreate, HorarioUpdate } from '../../../horario/models/horario.model';
import { HorarioService } from '../../../horario/services/horario.service';
import { HorarioDialogComponent, HorarioDialogData } from '../../../horario/components/horario-dialog/horario-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { aFechaString } from '../../../../core/utils/date-utils';

export interface GestionarModuloData {
  detalle: DetalleProgramaModulo;
}

@Component({
  selector: 'app-gestionar-modulo-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatRadioModule, MatDatepickerModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDividerModule, MatSnackBarModule,
  ],
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
  templateUrl: './gestionar-modulo-dialog.html',
  styleUrl: './gestionar-modulo-dialog.css',
})
export class GestionarModuloDialogComponent {
  private fb = inject(FormBuilder);
  private detalleService = inject(DetalleService);
  private horarioService = inject(HorarioService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<GestionarModuloDialogComponent>);
  private destroyRef = inject(DestroyRef);

  private readonly ESTADO_TRANSICIONES: Record<string, string[]> = {
    programado: ['en_curso', 'reprogramado'],
    en_curso: ['reprogramado', 'finalizado'],
    reprogramado: ['programado', 'en_curso'],
    finalizado: [],
  };

  form: FormGroup;
  horarios = signal<Horario[]>([]);
  horariosChanged = signal(false);
  saving = signal(false);

  estadoOriginal: string;
  fechaInicioOriginal: string | null;
  fechaFinOriginal: string | null;

  estadosDisponibles = computed<{ value: string; label: string }[]>(() => {
    const d = this.data.detalle;
    const permitidos = this.ESTADO_TRANSICIONES[d.estado] ?? [];
    return [
      { value: d.estado, label: this.etiquetaEstado(d.estado) },
      ...permitidos.map(v => ({ value: v, label: this.etiquetaEstado(v) })),
    ];
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: GestionarModuloData) {
    const d = data.detalle;
    this.estadoOriginal = d.estado;
    this.fechaInicioOriginal = d.fecha_inicio;
    this.fechaFinOriginal = d.fecha_fin;

    this.form = this.fb.group({
      nuevo_estado: [d.estado, Validators.required],
      fecha_inicio: [d.fecha_inicio ? new Date(d.fecha_inicio) : null],
      fecha_fin: [d.fecha_fin ? new Date(d.fecha_fin) : null],
      motivo: [''],
    });
  }

  ngOnInit() {
    this.cargarHorarios();
  }

  private cargarHorarios() {
    this.horarioService.getAll(this.data.detalle.id_detalle_programa_modulo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.horarios.set(data),
        error: () => this.snackbar.open('Error al cargar horarios', 'Cerrar', { duration: 3000 }),
      });
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
    const motivoValido = !this.motivoRequerido
      || (this.form.get('motivo')?.value?.length >= 5);
    return this.tieneCambios && !this.form.invalid && motivoValido && !this.saving();
  }

  private get estadoChanged(): boolean {
    return this.form.value.nuevo_estado !== this.estadoOriginal;
  }

  private get fechasChanged(): boolean {
    const v = this.form.value;
    return aFechaString(v.fecha_inicio) !== this.fechaInicioOriginal
        || aFechaString(v.fecha_fin) !== this.fechaFinOriginal;
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

  onNoClick() {
    this.dialogRef.close();
  }

  agregarHorario() {
    const subRef = this.dialog.open(HorarioDialogComponent, {
      width: '760px',
      data: { detalleId: this.data.detalle.id_detalle_programa_modulo } satisfies HorarioDialogData,
    });
    subRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: HorarioCreate | undefined) => {
      if (!result) return;
      result.id_detalle_programa_modulo = this.data.detalle.id_detalle_programa_modulo;
      this.horarioService.create(result).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.horariosChanged.set(true);
          this.cargarHorarios();
          this.snackbar.open('Horario agregado', 'OK', { duration: 2000 });
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Error al crear horario', 'Cerrar', { duration: 5000 }),
      });
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
      this.horarioService.update(horario.id_horario, result).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.horariosChanged.set(true);
          this.cargarHorarios();
          this.snackbar.open('Horario actualizado', 'OK', { duration: 2000 });
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Error al actualizar horario', 'Cerrar', { duration: 5000 }),
      });
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
      this.horarioService.cancelar(horario.id_horario).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.horariosChanged.set(true);
          this.cargarHorarios();
          this.snackbar.open('Horario eliminado', 'OK', { duration: 2000 });
        },
        error: () => this.snackbar.open('Error al eliminar horario', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  reactivarHorario(horario: Horario) {
    this.horarioService.update(horario.id_horario, { estado: 'activo' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.horariosChanged.set(true);
          this.cargarHorarios();
          this.snackbar.open('Horario restaurado', 'OK', { duration: 2000 });
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Error al restaurar horario', 'Cerrar', { duration: 5000 }),
      });
  }

  confirmar() {
    if (!this.puedeGuardar) return;
    this.saving.set(true);

    const d = this.data.detalle;
    const v = this.form.value;

    if (this.tieneCambiosDetalle) {
      const patch: DetalleUpdate = {};
      if (this.estadoChanged) {
        patch.estado = v.nuevo_estado;
      }
      if (this.fechasChanged) {
        patch.fecha_inicio = v.fecha_inicio ? aFechaString(v.fecha_inicio) : null;
        patch.fecha_fin = v.fecha_fin ? aFechaString(v.fecha_fin) : null;
      }
      patch.motivo = v.motivo;

      this.detalleService.update(d.id_detalle_programa_modulo, patch)
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.open('Módulo modificado con éxito', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          const detalle = err.error?.detail;
          const mensaje = Array.isArray(detalle)
            ? detalle.map((x: any) => x.msg || JSON.stringify(x)).join(' | ')
            : detalle || 'Error al modificar';
          this.snackbar.open(mensaje, 'Cerrar', { duration: 8000 });
        },
      });
    } else {
      this.saving.set(false);
      this.snackbar.open('Horarios actualizados', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    }
  }
}
