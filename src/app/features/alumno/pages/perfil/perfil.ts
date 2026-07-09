import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AlumnoService } from '../../services/alumno.service';
import { Alumno, AlumnoUpdate, GeneroAlumno } from '../../models/alumno.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatDividerModule, MatSnackBarModule,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  private alumnoService = inject(AlumnoService);
  private snackBar = inject(MatSnackBar);

  alumno = signal<Alumno | null>(null);
  editando = signal(false);
  cargando = signal(true);
  guardando = signal(false);

  editData: AlumnoUpdate = {};

  generos: GeneroAlumno[] = ['masculino', 'femenino', 'otro'];

  ngOnInit(): void {
    this.cargarPerfil();
  }

  private cargarPerfil(): void {
    this.cargando.set(true);
    this.alumnoService.getMiPerfil().subscribe({
      next: (data) => {
        this.alumno.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 4000 });
      },
    });
  }

  iniciarEdicion(): void {
    const a = this.alumno();
    if (!a) return;
    this.editData = {
      ci: a.ci,
      pasaporte: a.pasaporte,
      nombre: a.nombre,
      apellido: a.apellido,
      fecha_nacimiento: a.fecha_nacimiento,
      genero: a.genero,
      celular: a.celular,
      correo: a.correo,
      direccion: a.direccion,
    };
    this.editando.set(true);
  }

  cancelarEdicion(): void {
    this.editando.set(false);
    this.editData = {};
  }

  guardar(): void {
    this.guardando.set(true);
    this.alumnoService.actualizarMiPerfil(this.editData).subscribe({
      next: (data) => {
        this.alumno.set(data);
        this.editando.set(false);
        this.guardando.set(false);
        this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.detail || 'Error al actualizar perfil';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
