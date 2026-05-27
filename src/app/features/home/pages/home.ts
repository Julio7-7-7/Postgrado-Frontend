import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProgramaService } from '../../programa/services/programa.service';
import { DocenteService } from '../../docente/services/docente.service';

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
    MatButtonModule, MatIconModule, MatCardModule, MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private docenteService = inject(DocenteService);
  private destroyRef = inject(DestroyRef);

  totalProgramas = signal(0);
  totalDocentes = signal(0);
  isLoadingStats = signal(true);

  cards: NavCard[] = [
    { path: '/programas', icon: 'menu_book', title: 'Programas', desc: 'Gestiona maestrías, diplomados y cursos', color: '#2563eb' },
    { path: '/tipos-programa', icon: 'category', title: 'Tipos de Programa', desc: 'Categorías académicas y duración', color: '#7c3aed' },
    { path: '/alumnos', icon: 'people', title: 'Alumnos', desc: 'Inscripciones y documentación', color: '#0891b2' },
    { path: '/docentes', icon: 'person_pin', title: 'Docentes', desc: 'Banco de docentes y asignaciones', color: '#059669' },
  ];

  ngOnInit(): void {
    this.cargarStats();
  }

  private cargarStats() {
    this.programaService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.totalProgramas.set(data.length),
    });
    this.docenteService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.totalDocentes.set(data.length);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });
  }
}
