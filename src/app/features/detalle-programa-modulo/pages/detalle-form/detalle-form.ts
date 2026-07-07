import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { DetalleService } from '../../services/detalle.service';
import { DetalleProgramaModulo, DetalleUpdate, ModalidadType } from '../../models/detalle.model';
import { aFechaString, aDate } from '../../../../core/utils/date-utils';

@Component({
  selector: 'app-detalle-form',
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
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatCardModule, MatDividerModule, MatIconModule,
    MatSnackBarModule, MatDatepickerModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './detalle-form.html',
  styleUrl: './detalle-form.css',
})
export class DetalleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private detalleService = inject(DetalleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  idEditando: number | null = null;
  idEdicion = signal<number>(0);
  loading = signal(false);
  cargandoDatos = signal(false);

  modalidadOptions: (ModalidadType | null)[] = [null, 'presencial', 'virtual', 'semipresencial'];

  estadoOptions = [
    { value: 'programado', label: 'Programado' },
    { value: 'en_curso', label: 'En Curso' },
    { value: 'reprogramado', label: 'Reprogramado' },
    { value: 'finalizado', label: 'Finalizado' },
  ];

  infoModulo = signal('');

  constructor() {
    this.form = this.fb.group({
      modalidad: [null],
      orden: [null, [Validators.required, Validators.min(1)]],
      fecha_inicio: [null],
      fecha_fin: [null],
      estado: ['programado', Validators.required],
    });
  }

  ngOnInit(): void {
    const detalleId = this.route.snapshot.paramMap.get('detalleId');

    if (detalleId) {
      this.idEditando = +detalleId;
      this.cargarDatosParaEditar(this.idEditando);
    }
  }

  private cargarDatosParaEditar(id: number) {
    this.cargandoDatos.set(true);
    this.detalleService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.idEdicion.set(data.id_programa_version_edicion);
        this.infoModulo.set(`${data.modulo.sigla} — ${data.modulo.nombre_modulo}`);
        this.form.patchValue({
          modalidad: data.modalidad,
          orden: data.orden,
          fecha_inicio: aDate(data.fecha_inicio),
          fecha_fin: aDate(data.fecha_fin),
          estado: data.estado,
        });
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar datos del módulo', 'Cerrar', { duration: 4000 });
        this.volverALista();
      },
    });
  }

  private idEdicionDesdeUrl(): number | null {
    const match = this.router.url.match(/\/ediciones\/(\d+)\/modulos/);
    return match ? +match[1] : null;
  }

  guardar() {
    if (this.form.invalid) return;
    if (!this.idEditando) return;

    this.loading.set(true);
    const raw = this.form.value;

    const datos: DetalleUpdate = {
      modalidad: raw.modalidad ?? null,
      orden: raw.orden,
      fecha_inicio: raw.fecha_inicio ? aFechaString(raw.fecha_inicio) : null,
      fecha_fin: raw.fecha_fin ? aFechaString(raw.fecha_fin) : null,
      estado: raw.estado,
    };

    this.detalleService.update(this.idEditando, datos).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackbar.open('Módulo actualizado con éxito', 'OK', { duration: 3000 });
        this.volverALista();
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

  volverALista() {
    const edicionId = this.idEdicion() || this.idEdicionDesdeUrl();
    if (edicionId) {
      const url = this.router.url.split('/editar')[0];
      this.router.navigate([url], { replaceUrl: true });
    }
  }

}
