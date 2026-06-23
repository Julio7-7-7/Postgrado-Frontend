import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ProgramaVersionService } from '../../services/programa-version.service';
import { ProgramaService } from '../../../programa/services/programa.service';
import { ProgramaVersion } from '../../models/programa-version.model';
import { Programa } from '../../../programa/models/programa.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-programa-version-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './programa-version-list.html',
  styleUrl: './programa-version-list.css',
})
export class ProgramaVersionListComponent implements OnInit {
  private versionService = inject(ProgramaVersionService);
  private programaService = inject(ProgramaService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  apiUrl = environment.apiUrl;

  idPrograma = signal<number>(0);
  programa = signal<Programa | null>(null);
  versiones = signal<ProgramaVersion[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  versionesOrdenadas = computed(() =>
    this.versiones().sort((a, b) => a.version - b.version)
  );

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Programa no especificado');
      this.isLoading.set(false);
      return;
    }
    this.idPrograma.set(+id);
    this.cargarPrograma(+id);
    this.cargarVersiones();
  }

  private cargarPrograma(id: number) {
    this.programaService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.programa.set(data),
      error: () => this.router.navigate(['/programas']),
    });
  }

  cargarVersiones() {
    this.isLoading.set(true);
    this.error.set(null);

    this.versionService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.versiones.set(
          data
            .filter(v => v.id_programa === this.idPrograma())
            .sort((a, b) => a.version - b.version)
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las versiones.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  irAEdiciones(idVersion: number): void {
    this.router.navigate([idVersion, 'ediciones'], { relativeTo: this.route });
  }

  toggleVigente(event: MatSlideToggleChange, version: ProgramaVersion): void {
    const nuevoVigente = event.source.checked;
    const accion = nuevoVigente ? 'activar' : 'desactivar';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar Cambio de Estado',
        mensaje: `¿Está seguro de que desea ${accion} la versión v${version.version} del programa?`,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmado: boolean) => {
      if (!confirmado) {
        event.source.checked = !nuevoVigente;
        return;
      }

      this.versionService.update(version.id_programa_version, { vigente: nuevoVigente }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (actualizada: ProgramaVersion) => {
          this.versiones.update(lista =>
            lista.map(v =>
              v.id_programa_version === version.id_programa_version ? actualizada : v
            )
          );
          this.snackbar.open(
            `Versión ${version.version} ${nuevoVigente ? 'activada' : 'desactivada'} con éxito`,
            'OK',
            { duration: 3000 }
          );
        },
        error: () => {
          event.source.checked = !nuevoVigente;
          this.snackbar.open('Error al actualizar el estado de la versión', 'Cerrar', { duration: 4000 });
        },
      });
    });
  }
}
