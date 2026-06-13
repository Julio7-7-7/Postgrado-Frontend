import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
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
import { MatDividerModule } from '@angular/material/divider';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { DetalleService } from '../../services/detalle.service';
import { DocenteService } from '../../../docente/services/docente.service';
import { ModalidadService } from '../../../modalidad/services/modalidad.service';
import { HorarioService } from '../../../horario/services/horario.service';
import { Docente } from '../../../docente/models/docente.model';
import { Modalidad } from '../../../modalidad/models/modalidad.model';
import { DetalleProgramaModulo, DetalleUpdate } from '../../models/detalle.model';
import { Horario, HorarioCreate, HorarioUpdate } from '../../../horario/models/horario.model';
import { HorarioDialogComponent, HorarioDialogData } from '../../../horario/components/horario-dialog/horario-dialog';
import { aFechaString } from '../../../../core/utils/date-utils';

@Component({
  selector: 'app-detalle-list',
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
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatDividerModule,
  ],
  templateUrl: './detalle-list.html',
  styleUrl: './detalle-list.css',
})
export class DetalleListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private detalleService = inject(DetalleService);
  private docenteService = inject(DocenteService);
  private modalidadService = inject(ModalidadService);
  private horarioService = inject(HorarioService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  idEdicion = signal<number>(0);
  detalles = signal<DetalleProgramaModulo[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  docentes = signal<Docente[]>([]);
  modalidades = signal<Modalidad[]>([]);

  forms: Record<number, FormGroup> = {};
  horarios = signal<Record<number, Horario[]>>({});
  saving = signal<Set<number>>(new Set());

  estadoOptions = [
    { value: 'programado', label: 'Programado' },
    { value: 'en_curso', label: 'En Curso' },
    { value: 'pausado', label: 'Pausado' },
    { value: 'reprogramado', label: 'Reprogramado' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  ngOnInit(): void {
    const match = this.router.url.match(/\/ediciones\/(\d+)\/modulos/);
    if (!match) {
      this.error.set('Edición no especificada');
      this.isLoading.set(false);
      return;
    }
    this.idEdicion.set(+match[1]);
    this.cargarDocentes();
    this.cargarModalidades();
    this.cargarDetalles();
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

  cargarDetalles() {
    this.isLoading.set(true);
    this.error.set(null);
    this.detalleService.getAll(this.idEdicion()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalles.set(data.sort((a, b) => a.orden - b.orden));
        this.isLoading.set(false);
        this.construirForms();
        this.cargarTodosHorarios();
      },
      error: () => {
        this.error.set('No se pudieron cargar los módulos de la edición.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private construirForms() {
    for (const d of this.detalles()) {
      this.forms[d.id_detalle_programa_modulo] = this.fb.group({
        id_docente: [d.id_docente],
        id_modalidad: [d.id_modalidad],
        fecha_inicio: [d.fecha_inicio ? new Date(d.fecha_inicio) : null],
        fecha_fin: [d.fecha_fin ? new Date(d.fecha_fin) : null],
        estado: [d.estado, Validators.required],
        motivo: [''],
      });
    }
  }

  private cargarTodosHorarios() {
    const ids = this.detalles().map(d => d.id_detalle_programa_modulo);
    if (ids.length === 0) return;
    forkJoin(
      ids.map(id =>
        this.horarioService.getAll(id).pipe(takeUntilDestroyed(this.destroyRef))
      )
    ).subscribe({
      next: (results) => {
        this.horarios.update(current => {
          const next = { ...current };
          for (let i = 0; i < ids.length; i++) {
            next[ids[i]] = results[i];
          }
          return next;
        });
      },
      error: () => console.error('Error al cargar horarios'),
    });
  }

  formDe(detalle: DetalleProgramaModulo): FormGroup {
    return this.forms[detalle.id_detalle_programa_modulo];
  }

  horariosDe(detalle: DetalleProgramaModulo): Horario[] {
    return this.horarios()[detalle.id_detalle_programa_modulo] || [];
  }

  necesitaMotivo(detalle: DetalleProgramaModulo): boolean {
    const form = this.formDe(detalle);
    if (!form) return false;
    return ['pausado', 'reprogramado', 'cancelado'].includes(form.get('estado')?.value);
  }

  guardar(detalle: DetalleProgramaModulo) {
    const form = this.formDe(detalle);
    if (!form || form.invalid) return;

    this.saving.update(s => new Set(s).add(detalle.id_detalle_programa_modulo));
    const raw = form.value;

    const datos: DetalleUpdate = {
      id_docente: raw.id_docente ?? null,
      id_modalidad: raw.id_modalidad ?? null,
      fecha_inicio: raw.fecha_inicio ? aFechaString(raw.fecha_inicio) : null,
      fecha_fin: raw.fecha_fin ? aFechaString(raw.fecha_fin) : null,
      estado: raw.estado,
    };

    if (this.necesitaMotivo(detalle) && raw.motivo) {
      datos.motivo = raw.motivo;
    }

    this.detalleService.update(detalle.id_detalle_programa_modulo, datos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.saving.update(s => { const n = new Set(s); n.delete(detalle.id_detalle_programa_modulo); return n; });
          this.detalles.update(lista =>
            lista.map(m => m.id_detalle_programa_modulo === detalle.id_detalle_programa_modulo ? actualizado : m)
          );
          form.markAsPristine();
          this.snackbar.open(`"${detalle.modulo.sigla}" actualizado`, 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.saving.update(s => { const n = new Set(s); n.delete(detalle.id_detalle_programa_modulo); return n; });
          this.snackbar.open(err.error?.detail || 'Error al actualizar', 'Cerrar', { duration: 5000 });
        },
      });
  }

  cancelarModulo(detalle: DetalleProgramaModulo) {
    if (detalle.estado === 'cancelado') return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Cancelar Módulo',
        mensaje: `¿Está seguro de cancelar "${detalle.modulo.sigla} — ${detalle.modulo.nombre_modulo}" en esta edición?`,
      },
    });
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.detalleService.cancelar(detalle.id_detalle_programa_modulo)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.cargarDetalles();
            this.snackbar.open('Módulo cancelado', 'OK', { duration: 3000 });
          },
          error: () => this.snackbar.open('Error al cancelar', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  agregarHorario(detalle: DetalleProgramaModulo) {
    const dialogRef = this.dialog.open(HorarioDialogComponent, {
      width: '500px',
      data: { detalleId: detalle.id_detalle_programa_modulo } satisfies HorarioDialogData,
    });
    dialogRef.afterClosed().subscribe((result: HorarioCreate | undefined) => {
      if (!result) return;
      result.id_detalle_programa_modulo = detalle.id_detalle_programa_modulo;
      this.horarioService.create(result).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.cargarTodosHorarios();
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
          this.cargarTodosHorarios();
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
          this.cargarTodosHorarios();
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

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      programado: 'programado', en_curso: 'en-curso', pausado: 'pausado',
      reprogramado: 'reprogramado', finalizado: 'finalizado', cancelado: 'cancelado',
    };
    return map[estado] || '';
  }

  volverAEdiciones(): void {
    const idx = this.router.url.indexOf('/modulos');
    if (idx !== -1) {
      this.router.navigateByUrl(this.router.url.substring(0, idx));
    }
  }
}
