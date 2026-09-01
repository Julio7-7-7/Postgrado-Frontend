import { Component, OnDestroy, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { BackupService } from '../../services/backup.service';
import { Backup } from '../../models/backup.model';
import { BackupRestaurarDialogComponent } from '../../components/backup-restaurar-dialog/backup-restaurar-dialog';

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
  ],
  templateUrl: './backups.html',
  styleUrls: ['./backups.css'],
})
export class BackupsComponent implements OnInit {
  private service = inject(BackupService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  backups = signal<Backup[]>([]);
  cargando = signal(true);
  generando = signal(false);
  error = signal<string | null>(null);

  puedeCrear = computed(() => this.auth.hasPermiso('backups.crear'));
  puedeRestaurar = computed(() => this.auth.hasPermiso('backups.restaurar'));
  puedeEliminar = computed(() => this.auth.hasPermiso('backups.eliminar'));

  ultimoBackup = computed<Backup | null>(() => this.backups()[0] ?? null);

  retencion = 30;
  intervaloHoras = 24;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.service.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => { this.backups.set(list); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.error.set('No se pudieron cargar los backups'); },
    });
  }

  generar(): void {
    this.generando.set(true);
    this.service.generar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.generando.set(false);
        this.snackbar.open('Backup generado correctamente', 'Cerrar', { duration: 3000 });
        this.cargar();
      },
      error: err => {
        this.generando.set(false);
        this.snackbar.open(err.error?.detail || 'Error al generar el backup', 'Cerrar', { duration: 4000 });
      },
    });
  }

  descargar(b: Backup): void {
    this.service.descargar(b.id_backup).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = b.nombre;
        a.click();
        URL.revokeObjectURL(url);
        this.snackbar.open('Descarga iniciada', 'Cerrar', { duration: 2000 });
      },
      error: err => {
        this.snackbar.open(err.error?.detail || 'Error al descargar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  eliminar(b: Backup): void {
    this.service.eliminar(b.id_backup).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.open('Backup eliminado', 'Cerrar', { duration: 2500 });
        this.cargar();
      },
      error: () => {
        this.snackbar.open('Error al eliminar el backup', 'Cerrar', { duration: 4000 });
      },
    });
  }

  restaurar(): void {
    const ref = this.dialog.open(BackupRestaurarDialogComponent, {
      width: '560px',
      disableClose: true,
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.cargar();
    });
  }

  fmtTamano(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  fmtFecha(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  origenLabel(o: string): string {
    const map: Record<string, string> = {
      manual: 'Manual',
      auto: 'Automático',
      previo_a_restaurar: 'Seguridad pre-restauración',
    };
    return map[o] ?? o;
  }

  contaminado(b: Backup): boolean {
    return b.origen === 'previo_a_restaurar';
  }
}
