import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DocenteService } from '../../services/docente.service';
import { Docente } from '../../models/docente.model';
import { DetalleProgramaModulo } from '../../../detalle-programa-modulo/models/detalle.model';

@Component({
  selector: 'app-docente-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './docente-detalle.html',
  styleUrl: './docente-detalle.css',
})
export class DocenteDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(DocenteService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  docente = signal<Docente | null>(null);
  modulos = signal<DetalleProgramaModulo[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  modulosActuales = computed(() =>
    this.modulos().filter(m => m.estado !== 'finalizado')
  );
  modulosHistorial = computed(() =>
    this.modulos().filter(m => m.estado === 'finalizado')
  );

  columnasModulo: string[] = ['sigla', 'nombre', 'edicion', 'horas', 'fechas', 'estado', 'accion'];

  navegarAModulo(m: DetalleProgramaModulo): void {
    this.router.navigate(
      [
        '/programas', m.id_programa,
        'versiones', m.id_programa_version,
        'ediciones', m.id_programa_version_edicion,
        'modulos',
      ],
      { queryParams: { destacar: m.id_detalle_programa_modulo } },
    );
  }

  estadoModuloClass(estado: string): string {
    return 'estado-pill ' + estado.replace(/_/g, '-');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/docentes']);
      return;
    }
    this.cargarDatos(+id);
  }

  private cargarDatos(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (docente) => {
        this.docente.set(docente);
        this.cargarModulos(id);
      },
      error: () => {
        this.error.set('No se pudo cargar la información del docente');
        this.loading.set(false);
        this.snackbar.open('Error al cargar docente', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private cargarModulos(id: number): void {
    this.service.getModulos(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (modulos) => {
        this.modulos.set(modulos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.open('Error al cargar los módulos del docente', 'Cerrar', { duration: 4000 });
      },
    });
  }

  iniciales(): string {
    const d = this.docente();
    if (!d) return '';
    return (d.nombre.charAt(0) + d.apellido.charAt(0)).toUpperCase();
  }

  volver(): void {
    this.router.navigate(['/docentes']);
  }
}
