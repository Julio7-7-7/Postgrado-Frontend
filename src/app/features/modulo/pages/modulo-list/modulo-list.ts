import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ModuloService } from '../../services/modulo.service';
import { ProgramaVersionService } from '../../../programa-version/services/programa-version.service';
import { Modulo } from '../../models/modulo.model';
import { ProgramaVersion } from '../../../programa-version/models/programa-version.model';

@Component({
  selector: 'app-modulo-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './modulo-list.html',
  styleUrl: './modulo-list.css',
})
export class ModuloListComponent implements OnInit {
  private moduloService = inject(ModuloService);
  private versionService = inject(ProgramaVersionService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  idVersion = signal<number>(0);
  idPrograma = signal<number>(0);
  version = signal<ProgramaVersion | null>(null);
  modulos = signal<Modulo[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  bloqueado = signal(false);

  columnas: string[] = ['sigla', 'nombre', 'horas', 'creditos', 'estado', 'acciones'];

  ngOnInit(): void {
    const match = this.router.url.match(/\/versiones\/(\d+)\/modulos/);
    if (!match) {
      this.error.set('Versión no especificada');
      this.isLoading.set(false);
      return;
    }
    this.idVersion.set(+match[1]);

    const progMatch = this.router.url.match(/\/programas\/(\d+)\/versiones/);
    this.idPrograma.set(progMatch ? +progMatch[1] : 0);

    this.cargarVersion(this.idVersion());
  }

  private cargarVersion(id: number) {
    this.versionService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.version.set(data);
        this.bloqueado.set(data.ediciones_count > 0);
        this.cargarModulos();
      },
      error: () => this.router.navigate(['/programas']),
    });
  }

  cargarModulos() {
    this.isLoading.set(true);
    this.error.set(null);

    this.moduloService.getAll(this.idVersion()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.modulos.set(
          data.sort((a, b) => a.sigla.localeCompare(b.sigla))
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los módulos.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  toggleEstado(event: MatSlideToggleChange, modulo: Modulo): void {
    const esActivoOriginal = modulo.estado === 'activo';

    if (esActivoOriginal && this.bloqueado()) {
      event.source.checked = true;
      this.snackbar.open(
        'Esta versión tiene ediciones registradas, por lo que no se puede desactivar el módulo.',
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }

    const accion = esActivoOriginal ? 'desactivar' : 'reactivar';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Confirmar Cambio de Estado',
        mensaje: `¿Está seguro de que desea ${accion} el módulo "${modulo.sigla} - ${modulo.nombre_modulo}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) {
        event.source.checked = esActivoOriginal;
        return;
      }

      const nuevoEstado = esActivoOriginal ? 'inactivo' : 'activo';
      this.moduloService.update(modulo.id_modulo, { estado: nuevoEstado }).subscribe({
        next: (actualizado: Modulo) => {
          this.modulos.update(lista =>
            lista.map(m => (m.id_modulo === modulo.id_modulo ? actualizado : m))
          );
          this.snackbar.open(
            `Módulo "${modulo.sigla}" ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} con éxito`,
            'OK',
            { duration: 3000 }
          );
        },
        error: () => {
          event.source.checked = esActivoOriginal;
          this.snackbar.open('Error al actualizar el estado del módulo', 'Cerrar', { duration: 4000 });
        },
      });
    });
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
