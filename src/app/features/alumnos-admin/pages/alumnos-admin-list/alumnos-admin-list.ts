import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AlumnosAdminService } from '../../services/alumnos-admin.service';
import { AlumnoAdmin } from '../../models/alumnos-admin.model';

@Component({
  selector: 'app-alumnos-admin-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatTableModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
  ],
  templateUrl: './alumnos-admin-list.html',
  styleUrl: './alumnos-admin-list.css',
})
export class AlumnosAdminListComponent implements OnInit {
  private service = inject(AlumnosAdminService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  alumnos = signal<AlumnoAdmin[]>([]);
  filteredAlumnos = signal<AlumnoAdmin[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchText = signal('');
  filterAnio: number | null = null;
  filterSemestre: number | null = null;
  aniosDisponibles = signal<number[]>([]);
  pageIndex = signal(0);
  pageSize = signal(20);
  paginatedAlumnos = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredAlumnos().slice(start, start + this.pageSize());
  });
  columnas = ['nombre', 'ci', 'correo', 'celular', 'inscripciones', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.alumnos.set(data);
        this.filteredAlumnos.set(data);
        this.isLoading.set(false);
        this.extraerAnios(data);
        this.filtrar();
      },
      error: () => {
        this.error.set('Error al cargar alumnos');
        this.isLoading.set(false);
      },
    });
  }

  private extraerAnios(data: AlumnoAdmin[]): void {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    this.aniosDisponibles.set(years);
  }

  onPeriodoChange(): void {
    this.pageIndex.set(0);
    if (this.filterAnio) {
      this.service.getByPeriodo(this.filterAnio, this.filterSemestre ?? undefined)
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: data => {
            this.alumnos.set(data);
            this.filtrar();
          },
        });
    } else {
      this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => {
          this.alumnos.set(data);
          this.filtrar();
        },
      });
    }
  }

  filtrar(): void {
    const term = this.searchText().toLowerCase().trim();
    if (!term) {
      this.filteredAlumnos.set(this.alumnos());
      return;
    }
    this.filteredAlumnos.set(
      this.alumnos().filter(a =>
        a.nombre.toLowerCase().includes(term) ||
        a.apellido.toLowerCase().includes(term) ||
        (a.ci && a.ci.toLowerCase().includes(term)) ||
        a.correo.toLowerCase().includes(term)
      )
    );
  }

  onSearch(value: string): void {
    this.searchText.set(value);
    this.pageIndex.set(0);
    this.filtrar();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  iniciales(a: AlumnoAdmin): string {
    return (a.nombre[0] + a.apellido[0]).toUpperCase();
  }

  abrirFormulario(): void {
    // TODO: dialog para crear alumno
    this.snackbar.open('Formulario de creación próximamente', 'Cerrar', { duration: 3000 });
  }

  editarAlumno(a: AlumnoAdmin): void {
    // TODO: dialog para editar alumno
    this.snackbar.open('Formulario de edición próximamente', 'Cerrar', { duration: 3000 });
  }
}
