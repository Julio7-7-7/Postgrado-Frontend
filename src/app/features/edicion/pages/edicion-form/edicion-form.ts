import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
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
      next: (data) => this.infoVersion.set(`${data.programa.nombre_programa} — v${data.version}`),
      error: () => this.router.navigate(['/programas']),
    });
  }

  private cargarDatosParaEditar(id: number) {
    this.cargandoDatos.set(true);
    this.edicionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar la edición', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/programas', this.idPrograma(), 'versiones', this.idVersion(), 'ediciones']);
      },
    });
  }

  guardar() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const datos: ProgramaVersionEdicionCreate = {
      ...this.form.value,
      id_programa_version: this.idVersion(),
      gestion: this.form.value.gestion || undefined,
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
        this.snackbar.open(
          err.error?.detail || 'Ocurrió un error al procesar la solicitud',
          'Cerrar',
          { duration: 4000 }
        );
      },
    });
  }
}
