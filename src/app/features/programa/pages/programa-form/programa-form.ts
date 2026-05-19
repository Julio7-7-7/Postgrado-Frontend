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

import { ProgramaService } from '../../services/programa.service';
import { TipoProgramaService } from '../../../tipo-programa/services/tipo-programa.service';
import { ProgramaCreate } from '../../models/programa.model';
import { TipoPrograma } from '../../../tipo-programa/models/tipo-programa.model';

@Component({
  selector: 'app-programa-form',
  standalone: true,
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
  ],
  templateUrl: './programa-form.html',
  styleUrl: './programa-form.css',
})
export class ProgramaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ProgramaService);
  private tipoProgramaService = inject(TipoProgramaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  idEditando: number | null = null;
  loading = signal(false);
  cargandoDatos = signal(false);
  tiposPrograma = signal<TipoPrograma[]>([]);

  constructor() {
    this.form = this.fb.group({
      nombre_programa: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      id_tipo_programa: [null, Validators.required],
      estado: ['activo', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarTiposPrograma();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idEditando = +id;
      this.cargarDatosParaEditar(this.idEditando);
    }
  }

  private cargarTiposPrograma() {
    this.tipoProgramaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.tiposPrograma.set(data.filter(t => t.estado === 'activo'));
      },
    });
  }

  private cargarDatosParaEditar(id: number) {
    this.cargandoDatos.set(true);
    this.service.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const { nombre_programa, id_tipo_programa, estado } = data;
        this.form.patchValue({ nombre_programa, id_tipo_programa, estado }, { emitEvent: false });
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar los datos del registro', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/programas']);
      },
    });
  }

  guardar() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const datos = this.form.value as ProgramaCreate;

    const peticion = this.idEditando
      ? this.service.update(this.idEditando, datos)
      : this.service.create(datos);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        const mensaje = this.idEditando
          ? 'Programa actualizado con éxito'
          : 'Programa creado con éxito';
        this.snackbar.open(mensaje, 'OK', { duration: 3000 });
        this.router.navigate(['/programas']);
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
