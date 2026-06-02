import { Component, OnInit, signal, inject, DestroyRef, ViewChild, ElementRef } from '@angular/core';
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
import { environment } from '../../../../environments/environment';

interface NavCard {
  path: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
}

const CARD_STEP = 400; // 380 card + 20 gap

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

  @ViewChild('track', { static: false }) trackRef!: ElementRef<HTMLElement>;

  apiUrl = environment.apiUrl;

  totalProgramas = signal(0);
  totalDocentes = signal(0);
  isLoadingStats = signal(true);

  edicionesActivas = signal<ProgramaVersionEdicion[]>([]);

  private offset = 0;
  private autoScrollId: number | null = null;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  cards: NavCard[] = [
    { path: '/programas', icon: 'menu_book', title: 'Programas', desc: 'Gestiona maestrías, diplomados y cursos', color: '#2563eb' },
    { path: '/tipos-programa', icon: 'category', title: 'Tipos de Programa', desc: 'Categorías académicas y duración', color: '#7c3aed' },
    { path: '/alumnos', icon: 'people', title: 'Alumnos', desc: 'Inscripciones y documentación', color: '#0891b2' },
    { path: '/docentes', icon: 'person_pin', title: 'Docentes', desc: 'Banco de docentes y asignaciones', color: '#059669' },
  ];

  ngOnInit(): void {
    this.cargarStats();
    this.cargarEdiciones();
    this.destroyRef.onDestroy(() => this.detenerAutoScroll());
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
        setTimeout(() => this.iniciarAutoScroll());
      },
      error: () => {
        this.snackBar.open('Error al cargar ediciones activas', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private get track(): HTMLElement | null {
    return this.trackRef?.nativeElement ?? null;
  }

  private get totalWidth(): number {
    return this.edicionesActivas().length * CARD_STEP;
  }

  private aplicarTransform(): void {
    const el = this.track;
    if (el) el.style.transform = `translateX(${this.offset}px)`;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.detenerAutoScroll();

    this.offset -= event.deltaY || event.deltaX;
    this.clampOffset();
    this.aplicarTransform();

    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => this.iniciarAutoScroll(), 1800);
  }

  private clampOffset(): void {
    const max = 0;
    const min = -this.totalWidth;
    this.offset = Math.max(min, Math.min(max, this.offset));
  }

  private iniciarAutoScroll(): void {
    this.detenerAutoScroll();
    if (!this.track || this.totalWidth === 0) return;

    const step = () => {
      this.offset -= 0.6;
      if (this.offset <= -this.totalWidth) {
        this.offset = 0;
      }
      this.aplicarTransform();
      this.autoScrollId = requestAnimationFrame(step);
    };
    this.autoScrollId = requestAnimationFrame(step);
  }

  private detenerAutoScroll(): void {
    if (this.autoScrollId !== null) {
      cancelAnimationFrame(this.autoScrollId);
      this.autoScrollId = null;
    }
    if (this.scrollTimeout !== null) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  getFotoUrl(foto: string | null): string {
    return foto ? `${this.apiUrl}${foto}` : '';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
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
