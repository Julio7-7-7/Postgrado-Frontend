import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ModalidadService } from '../../../modalidad/services/modalidad.service';
import { HorarioService } from '../../../horario/services/horario.service';
import { Modalidad } from '../../../modalidad/models/modalidad.model';
import { DetalleProgramaModulo, DetalleUpdate } from '../../models/detalle.model';
import { Horario, HorarioCreate, HorarioUpdate } from '../../../horario/models/horario.model';
import { HorarioDialogComponent, HorarioDialogData } from '../../../horario/components/horario-dialog/horario-dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ModificarDialogComponent, ModificarResult } from '../../components/modificar-dialog/modificar-dialog';
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

  modalidades = signal<Modalidad[]>([]);
  horarios = signal<Horario[]>([]);

  constructor() {
    this.form = this.fb.group({
      id_modalidad: [null],
      fecha_inicio: [null],
      fecha_fin: [null],
    });
  }

  ngOnInit(): void {
    const detalleId = this.route.snapshot.paramMap.get('detalleId');
    if (!detalleId) {
      this.snackbar.open('Detalle no especificado', 'Cerrar', { duration: 4000 });
      this.volverAlCarrusel();
      return;
    }

    this.cargarModalidades();
    this.cargarDetalle(+detalleId);
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
          id_modalidad: data.id_modalidad,
          fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
          fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null,
        });
        this.form.markAsPristine();
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

  labelEstado(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado', en_curso: 'En Curso', reprogramado: 'Reprogramado', finalizado: 'Finalizado',
    };
    return map[estado] || estado;
  }

  abrirModificarDialog() {
    const d = this.detalle();
    if (!d) return;
    this.loading.set(true);
    this.detalleService.getAll(this.idEdicion()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (modulos) => {
        this.loading.set(false);
        const dialogRef = this.dialog.open(ModificarDialogComponent, {
          width: '700px',
          data: { detalle: d, modulos },
        });
        dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: ModificarResult | undefined) => {
          if (!result) return;
          this.aplicarModificacion(result);
        });
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.open('Error al cargar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private aplicarModificacion(result: ModificarResult) {
    const d = this.detalle();
    if (!d) return;
    this.loading.set(true);

    const estadoCambio = result.estado !== d.estado;
    const fechasCambio = result.fecha_inicio !== d.fecha_inicio || result.fecha_fin !== d.fecha_fin;

    const hayPatch = estadoCambio || fechasCambio;
    const hayReorder = !!result.ordenes;

    if (!hayPatch && !hayReorder) {
      this.loading.set(false);
      return;
    }

    const hacerPatch = () => {
      if (!hayPatch) {
        if (hayReorder) return hacerReorder();
        this.loading.set(false);
        return;
      }

      const patch: DetalleUpdate = {};
      if (estadoCambio) {
        patch.estado = result.estado;
        patch.motivo = result.motivo;
      }
      if (fechasCambio) {
        patch.fecha_inicio = result.fecha_inicio;
        patch.fecha_fin = result.fecha_fin;
      }

      this.detalleService.update(d.id_detalle_programa_modulo, patch)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => { if (hayReorder) hacerReorder(); else finalizar(); },
          error: (err) => this.manejarError(err),
        });
    };

    const hacerReorder = () => {
      this.detalleService.reordenar({ id_edicion: d.id_programa_version_edicion, ordenes: result.ordenes! })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => finalizar(),
          error: (err) => this.manejarError(err),
        });
    };

    const finalizar = () => {
      this.loading.set(false);
      this.snackbar.open('Módulo modificado con éxito', 'OK', { duration: 3000 });
      this.cargarDetalle(d.id_detalle_programa_modulo);
    };

    hacerPatch();
  }

  guardar() {
    if (this.form.invalid || !this.detalle()) return;
    this.loading.set(true);
    const raw = this.form.value;

    const datos: DetalleUpdate = {
      id_modalidad: raw.id_modalidad ?? null,
      fecha_inicio: raw.fecha_inicio ? aFechaString(raw.fecha_inicio) : null,
      fecha_fin: raw.fecha_fin ? aFechaString(raw.fecha_fin) : null,
    };

    this.detalleService.update(this.detalle()!.id_detalle_programa_modulo, datos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.recargarTrasAccion('Módulo actualizado con éxito'),
        error: (err) => this.manejarError(err),
      });
  }

  private recargarTrasAccion(mensaje = 'Módulo actualizado con éxito') {
    this.loading.set(false);
    this.snackbar.open(mensaje, 'OK', { duration: 3000 });
    this.cargarDetalle(this.detalle()!.id_detalle_programa_modulo);
  }

  private manejarError(err: any) {
    this.loading.set(false);
    const detalle = err.error?.detail;
    const mensaje = Array.isArray(detalle)
      ? detalle.map((d: any) => d.msg || JSON.stringify(d)).join(' | ')
      : detalle || 'Error al actualizar';
    this.snackbar.open(mensaje, 'Cerrar', { duration: 8000 });
  }

  agregarHorario() {
    const d = this.detalle();
    if (!d) return;
    const dialogRef = this.dialog.open(HorarioDialogComponent, {
      width: '500px',
      data: { detalleId: d.id_detalle_programa_modulo } satisfies HorarioDialogData,
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: HorarioCreate | undefined) => {
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
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: HorarioUpdate | undefined) => {
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

  reactivarHorario(horario: Horario) {
    this.horarioService.update(horario.id_horario, { estado: 'activo' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cargarHorarios();
          this.snackbar.open('Horario restaurado', 'OK', { duration: 3000 });
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Error al restaurar horario', 'Cerrar', { duration: 5000 }),
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
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado: boolean) => {
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
