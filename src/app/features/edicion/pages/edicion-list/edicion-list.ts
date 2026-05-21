import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { EdicionService } from '../../services/edicion.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { ProgramaVersionEdicion } from '../../models/edicion.model';
import { ProgramaVersion } from '../../../programa-version/models/programa-version.model';

@Component({
  selector: 'app-edicion-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
  ],
  templateUrl: './edicion-list.html',
  styleUrl: './edicion-list.css',
})
export class EdicionListComponent implements OnInit {
  private edicionService = inject(EdicionService);
  private versionService = inject(ProgramaVersionService);
  private snackbar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  idVersion = signal<number>(0);
  idPrograma = signal<number>(0);
  version = signal<ProgramaVersion | null>(null);
  ediciones = signal<ProgramaVersionEdicion[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  columnas: string[] = ['edicion', 'gestion', 'modalidad', 'estado', 'fechas', 'precio', 'acciones'];

  ngOnInit(): void {
    const versionId = this.route.parent?.snapshot.paramMap.get('versionId');
    const programaId = this.route.parent?.parent?.snapshot.paramMap.get('id');

    if (!versionId) {
      this.error.set('Versión no especificada');
      this.isLoading.set(false);
      return;
    }

    this.idVersion.set(+versionId);
    this.idPrograma.set(programaId ? +programaId : 0);
    this.cargarVersion(+versionId);
    this.cargarEdiciones();
  }

  private cargarVersion(id: number) {
    this.versionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.version.set(data),
      error: () => this.router.navigate(['/programas']),
    });
  }

  cargarEdiciones() {
    this.isLoading.set(true);
    this.error.set(null);

    this.edicionService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.ediciones.set(
          data
            .filter(e => e.id_programa_version === this.idVersion())
            .sort((a, b) => b.edicion - a.edicion)
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las ediciones.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      programado: 'programado',
      en_curso: 'en-curso',
      pausado: 'pausado',
      finalizado: 'finalizado',
      cancelado: 'cancelado',
    };
    return map[estado] || '';
  }

  volverAVersiones(): void {
    if (this.idPrograma()) {
      this.router.navigate(['/programas', this.idPrograma(), 'versiones']);
    } else {
      this.router.navigate(['/programas']);
    }
  }
}
