import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

  ngOnInit(): void {
    const match = this.router.url.match(/\/versiones\/(\d+)\/ediciones/);
    if (!match) {
      this.error.set('Versión no especificada');
      this.isLoading.set(false);
      return;
    }
    this.idVersion.set(+match[1]);

    const progMatch = this.router.url.match(/\/programas\/(\d+)\/versiones/);
    this.idPrograma.set(progMatch ? +progMatch[1] : 0);

    this.cargarVersion(this.idVersion());
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

    this.edicionService.getAll(this.idVersion()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.ediciones.set(
          data.sort((a, b) => b.edicion - a.edicion)
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
      reprogramado: 'reprogramado',
      finalizado: 'finalizado',
    };
    return map[estado] || '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado',
      en_curso: 'En Curso',
      reprogramado: 'Reprogramado',
      finalizado: 'Finalizado',
    };
    return map[estado] || estado;
  }

  abrirDetalle(edicion: ProgramaVersionEdicion): void {
    this.router.navigate([edicion.id_programa_version_edicion, 'modulos'], { relativeTo: this.route });
  }

  volverAVersiones(): void {
    const match = this.router.url.match(/^(\/programas\/\d+\/versiones)/);
    if (match) {
      this.router.navigateByUrl(match[1]);
    } else {
      this.router.navigate(['/programas']);
    }
  }
}
