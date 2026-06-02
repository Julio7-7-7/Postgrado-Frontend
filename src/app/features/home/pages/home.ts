import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProgramaService } from '../../programa/services/programa.service';
import { DocenteService } from '../../docente/services/docente.service';
import { EdicionService } from '../../edicion/services/edicion.service';
import { ProgramaVersionEdicion } from '../../edicion/models/edicion.model';

const CARD_STEP = 336;

interface NavCard {
  path: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule,
    MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private docenteService = inject(DocenteService);
  private edicionService = inject(EdicionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  totalProgramas = signal(0);
  totalDocentes = signal(0);
  isLoadingStats = signal(true);

  edicionesActivas = signal<ProgramaVersionEdicion[]>([]);
  currentIndex = signal(0);
  isPaused = signal(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  cards: NavCard[] = [
    { path: '/programas', icon: 'menu_book', title: 'Programas', desc: 'Gestiona maestrías, diplomados y cursos', color: '#2563eb' },
    { path: '/tipos-programa', icon: 'category', title: 'Tipos de Programa', desc: 'Categorías académicas y duración', color: '#7c3aed' },
    { path: '/alumnos', icon: 'people', title: 'Alumnos', desc: 'Inscripciones y documentación', color: '#0891b2' },
    { path: '/docentes', icon: 'person_pin', title: 'Docentes', desc: 'Banco de docentes y asignaciones', color: '#059669' },
  ];

  ngOnInit(): void {
    this.cargarStats();
    this.cargarEdiciones();
    this.destroyRef.onDestroy(() => this.detenerAutoPlay());
  }

  private cargarStats() {
    this.programaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.totalProgramas.set(data.length),
      error: () => this.isLoadingStats.set(false),
    });
    this.docenteService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.totalDocentes.set(data.length);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });
  }

  private cargarEdiciones() {
    this.edicionService.getAll(undefined, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.edicionesActivas.set(data);
        this.iniciarAutoPlay();
      },
      error: () => {
        this.snackBar.open('Error al cargar ediciones activas', 'Cerrar', { duration: 4000 });
      },
    });
  }

  get trackTransform(): string {
    return `translateX(-${this.currentIndex() * CARD_STEP}px)`;
  }

  get totalSlides(): number {
    return Math.max(1, this.edicionesActivas().length);
  }

  nextSlide(): void {
    const total = this.totalSlides;
    this.currentIndex.update(i => (i + 1) % total);
  }

  prevSlide(): void {
    const total = this.totalSlides;
    this.currentIndex.update(i => (i - 1 + total) % total);
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }

  pausar(): void {
    this.isPaused.set(true);
    this.detenerAutoPlay();
  }

  reanudar(): void {
    this.isPaused.set(false);
    this.iniciarAutoPlay();
  }

  private iniciarAutoPlay(): void {
    this.detenerAutoPlay();
    this.intervalId = setInterval(() => this.nextSlide(), 4000);
  }

  private detenerAutoPlay(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  irAModulos(edicion: ProgramaVersionEdicion): void {
    const programa = edicion.programa_version.programa;
    this.router.navigate([
      '/programas', programa.id_programa,
      'versiones', edicion.programa_version.id_programa_version,
      'ediciones', edicion.id_programa_version_edicion,
      'modulos',
    ]);
  }

  convertirFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  colorEstado(estado: string): string {
    const colores: Record<string, string> = {
      programado: '#2563eb',
      en_curso: '#16a34a',
      pausado: '#ca8a04',
      finalizado: '#64748b',
      cancelado: '#dc2626',
    };
    return colores[estado] || '#64748b';
  }
}
