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

import { TipoProgramaService } from '../../services/tipo-programa.service';
import { TipoProgramaCreate } from '../../models/tipo-programa.model';
import { ModalidadAcademicaResponse } from '../../../admin/models/admin.models';

@Component({
  selector: 'app-tipo-programa-form',
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
  templateUrl: './tipo-programa-form.html',
  styleUrl: './tipo-programa-form.css'
})
export class TipoProgramaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TipoProgramaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  idEditando: number | null = null;
  loading = signal(false);
  cargandoDatos = signal(false);

  modalidades = signal<ModalidadAcademicaResponse[]>([]);
  selectedModalidades = signal<Set<number>>(new Set());

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      estado: ['activo', Validators.required],
      cupo_minimo: [null, [Validators.min(1)]],
      duracion_minima_meses: [null, [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.cargarModalidades();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idEditando = +id;
      this.cargarDatosParaEditar(this.idEditando);
    }
  }

  private cargarModalidades(): void {
    this.service.getModalidades().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.modalidades.set(data.filter(m => m.estado === 'activo')),
    });
  }

  private cargarDatosParaEditar(id: number) {
    this.cargandoDatos.set(true);
    this.service.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        const ids = new Set(data.modalidades.map(m => m.id_modalidad_academica));
        this.selectedModalidades.set(ids);
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.snackbar.open('Error al cargar los datos del registro', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/tipos-programa']);
      }
    });
  }

  toggleModalidad(id: number): void {
    this.selectedModalidades.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  guardar() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const datos: TipoProgramaCreate = {
      ...this.form.value,
      modalidades: Array.from(this.selectedModalidades()),
    };

    const peticion = this.idEditando
      ? this.service.update(this.idEditando, datos)
      : this.service.create(datos);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        const mensaje = this.idEditando
          ? 'Registro actualizado con éxito'
          : 'Registro creado con éxito';
        this.snackbar.open(mensaje, 'OK', { duration: 3000 });
        this.router.navigate(['/tipos-programa'], { replaceUrl: true });
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
