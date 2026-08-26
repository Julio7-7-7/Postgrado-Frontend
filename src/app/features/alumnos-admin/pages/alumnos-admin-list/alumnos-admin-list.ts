import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AlumnosAdminService } from '../../services/alumnos-admin.service';
import { AlumnoAdmin } from '../../models/alumnos-admin.model';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-alumnos-admin-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
  ],
  templateUrl: './alumnos-admin-list.html',
  styleUrl: './alumnos-admin-list.css',
})
export class AlumnosAdminListComponent implements OnInit {
  private service = inject(AlumnosAdminService);
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

  readonly PAGE_SIZE = PAGE_SIZE;

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filteredAlumnos().length / PAGE_SIZE)));
  paginasArr = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i));

  paginatedAlumnos = computed(() => {
    const start = this.pageIndex() * PAGE_SIZE;
    return this.filteredAlumnos().slice(start, start + PAGE_SIZE);
  });

  rangeStart = computed(() => this.filteredAlumnos().length === 0 ? 0 : this.pageIndex() * PAGE_SIZE + 1);
  rangeEnd = computed(() => Math.min((this.pageIndex() + 1) * PAGE_SIZE, this.filteredAlumnos().length));

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

  irAPagina(p: number): void {
    this.pageIndex.set(Math.max(0, Math.min(p, this.totalPaginas() - 1)));
  }

  iniciales(a: AlumnoAdmin): string {
    return (a.nombre[0] + a.apellido[0]).toUpperCase();
  }
}
