import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { DetalleService } from '../../services/detalle.service';
import { DocenteService } from '../../../docente/services/docente.service';
import { HorarioService } from '../../../horario/services/horario.service';
import { DetalleProgramaModulo } from '../../models/detalle.model';
import { Horario } from '../../../horario/models/horario.model';
import { DocenteCardDialogComponent } from '../../../docente/components/docente-card-dialog/docente-card-dialog';

@Component({
  selector: 'app-detalle-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatDividerModule,
  ],
  templateUrl: './detalle-list.html',
  styleUrl: './detalle-list.css',
})
export class DetalleListComponent implements OnInit {
  private detalleService = inject(DetalleService);
  private docenteService = inject(DocenteService);
  private horarioService = inject(HorarioService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  idEdicion = signal<number>(0);
  detalles = signal<DetalleProgramaModulo[]>([]);
  currentIndex = signal(0);
  isLoading = signal(true);
  error = signal<string | null>(null);

  horarios = signal<Record<number, Horario[]>>({});

  ngOnInit(): void {
    const match = this.router.url.match(/\/ediciones\/(\d+)\/modulos/);
    if (!match) {
      this.error.set('Edición no especificada');
      this.isLoading.set(false);
      return;
    }
    this.idEdicion.set(+match[1]);
    this.cargarDetalles();
  }

  cargarDetalles() {
    this.isLoading.set(true);
    this.error.set(null);
    this.detalleService.getAll(this.idEdicion()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.detalles.set(data.sort((a, b) => a.orden - b.orden));
        this.isLoading.set(false);
        this.currentIndex.set(0);
        this.cargarTodosHorarios();
        setTimeout(() => this.ajustarAltura(), 150);
      },
      error: () => {
        this.error.set('No se pudieron cargar los módulos de la edición.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  anterior() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
      setTimeout(() => this.ajustarAltura());
    }
  }

  siguiente() {
    if (this.currentIndex() < this.detalles().length - 1) {
      this.currentIndex.update(i => i + 1);
      setTimeout(() => this.ajustarAltura());
    }
  }

  irA(index: number) {
    if (index >= 0 && index < this.detalles().length && index !== this.currentIndex()) {
      this.currentIndex.set(index);
      setTimeout(() => this.ajustarAltura());
    }
  }

  private ajustarAltura() {
    const activeCard = document.querySelector<HTMLElement>('.modulo-card.active');
    const stage = document.querySelector<HTMLElement>('.carousel-stage');
    if (activeCard && stage) {
      stage.style.minHeight = activeCard.offsetHeight + 'px';
    }
  }

  abrirGestionar(detalle: DetalleProgramaModulo) {
    const base = this.router.url.replace(/\/modulos.*/, '/modulos');
    this.router.navigate([`${base}/gestionar/${detalle.id_detalle_programa_modulo}`]);
  }

  abrirDocenteCard(docenteId: number) {
    this.docenteService.getById(docenteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (docente) => {
        this.dialog.open(DocenteCardDialogComponent, {
          width: '480px',
          data: docente,
        });
      },
      error: () => this.snackbar.open('Error al cargar datos del docente', 'Cerrar', { duration: 4000 }),
    });
  }

  private cargarTodosHorarios() {
    const ids = this.detalles().map(d => d.id_detalle_programa_modulo);
    if (ids.length === 0) return;
    forkJoin(
      ids.map(id =>
        this.horarioService.getAll(id).pipe(takeUntilDestroyed(this.destroyRef))
      )
    ).subscribe({
      next: (results) => {
        this.horarios.update(current => {
          const next = { ...current };
          for (let i = 0; i < ids.length; i++) {
            next[ids[i]] = results[i];
          }
          return next;
        });
        setTimeout(() => this.ajustarAltura(), 100);
      },
      error: () => console.error('Error al cargar horarios'),
    });
  }

  horariosDe(detalle: DetalleProgramaModulo): Horario[] {
    return this.horarios()[detalle.id_detalle_programa_modulo] || [];
  }

  diaLabel(dia: string): string {
    const map: Record<string, string> = {
      lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
      jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
    };
    return map[dia] || dia;
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado', en_curso: 'En Curso',
      reprogramado: 'Reprogramado', finalizado: 'Finalizado',
    };
    return map[estado] || estado;
  }

  volverAEdiciones(): void {
    const idx = this.router.url.indexOf('/modulos');
    if (idx !== -1) {
      this.router.navigateByUrl(this.router.url.substring(0, idx));
    }
  }
}
