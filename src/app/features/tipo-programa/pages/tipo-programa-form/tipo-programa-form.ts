import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider'; // <-- Agregado para solucionar el NG8001
import { MatIconModule } from '@angular/material/icon';       // <-- Agregado para los <mat-icon> del HTML

import { TipoProgramaService } from '../../services/tipo-programa.service';

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
    MatDividerModule, // <-- Incluido en los imports del componente
    MatIconModule     // <-- Incluido en los imports del componente
  ],
  templateUrl: './tipo-programa-form.html',
  styleUrl: './tipo-programa-form.css'
})
export class TipoProgramaFormComponent implements OnInit {
  // Inyecciones modernas
  private fb = inject(FormBuilder);
  private service = inject(TipoProgramaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  idEditando: number | null = null;

  constructor() {
    // Definimos la estructura del formulario y sus validaciones
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      estado: ['activo', Validators.required],
      cupo_minimo: [null, [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    // Verificamos si la URL trae un ID (ej: /editar/5)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idEditando = +id;
      this.cargarDatosParaEditar(this.idEditando);
    }
  }

  private cargarDatosParaEditar(id: number) {
    this.service.getById(id).subscribe({
      next: (data) => {
        // Rellenamos el formulario con los datos que vienen de FastAPI
        this.form.patchValue(data);
      },
      error: (err) => {
        alert('Error al cargar los datos del registro.');
        this.router.navigate(['/tipos-programa']);
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;

    // Decidimos si llamar a POST (crear) o PATCH (actualizar)
    const peticion = this.idEditando 
      ? this.service.update(this.idEditando, this.form.value)
      : this.service.create(this.form.value);

    peticion.subscribe({
      next: () => {
        // Si todo sale bien, volvemos a la tabla
        this.router.navigate(['/tipos-programa']);
      },
      error: (err) => {
        // Mostramos el error que configuramos en FastAPI (Pydantic)
        alert(err.error?.detail || 'Ocurrió un error al procesar la solicitud.');
      }
    });
  }
}