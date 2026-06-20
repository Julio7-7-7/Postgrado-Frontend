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

import { DocenteService } from '../../services/docente.service';
import { DocenteCreate } from '../../models/docente.model';

@Component({
  selector: 'app-docente-form',
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
  templateUrl: './docente-form.html',
  styleUrl: './docente-form.css'
})
export class DocenteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(DocenteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  idEditando: number | null = null;
  loading = signal(false);
  cargandoDatos = signal(false);

  constructor() {
    this.form = this.fb.group({
      ci: ['', [Validators.required, Validators.minLength(5)]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      genero: [null],
      extension: [null],
      grado: [null],
      titulo: [null, [Validators.maxLength(100)]],
      celular: [null, [Validators.maxLength(20), Validators.pattern('^[0-9]+$')]],
      correo: ['', [Validators.required, Validators.email]],
      estado: ['activo', Validators.required],
    });
  }

  soloNumeros(event: KeyboardEvent) {
    const char = event.key;
    if (char.length === 1 && !/^[0-9]$/.test(char)) {
      event.preventDefault();
    }
  }

  soloLetras(event: KeyboardEvent) {
    const char = event.key;
    if (char.length === 1 && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(char)) {
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idEditando = +id;
      this.cargarDatosParaEditar(this.idEditando);
    }
  }

  private cargarDatosParaEditar(id: number) {
    this.cargandoDatos.set(true);
    this.service.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar los datos del registro', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/docentes']);
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const datos = this.form.value as DocenteCreate;

    const peticion = this.idEditando
      ? this.service.update(this.idEditando, datos)
      : this.service.create(datos);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        const mensaje = this.idEditando
          ? 'Docente actualizado con éxito'
          : 'Docente creado con éxito';
        this.snackbar.open(mensaje, 'OK', { duration: 3000 });
        this.router.navigate(['/docentes'], { replaceUrl: true });
      },
      error: (err) => {
        this.loading.set(false);
        this.snackbar.open(
          err.error?.detail || 'Ocurrió un error al procesar la solicitud',
          'Cerrar',
          { duration: 4000 }
        );
      }
    });
  }
}
