import { Component, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BackupService } from '../../services/backup.service';
import { ImportarBackupResult } from '../../models/backup.model';

@Component({
  selector: 'app-backup-restaurar-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './backup-restaurar-dialog.html',
  styleUrls: ['./backup-restaurar-dialog.css'],
})
export class BackupRestaurarDialogComponent {
  private service = inject(BackupService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<BackupRestaurarDialogComponent>);

  archivo = signal<File | null>(null);
  confirmText = '';
  restaurando = signal(false);

  confirmado = signal(false);

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      if (!file.name.endsWith('.bak')) {
        this.snackbar.open('El archivo debe ser un backup .bak', 'Cerrar', { duration: 3000 });
        input.value = '';
        this.archivo.set(null);
        return;
      }
      this.archivo.set(file);
    }
  }

  quitarArchivo(): void {
    this.archivo.set(null);
    this.confirmText = '';
  }

  confirmacionValida(): boolean {
    return this.confirmText === 'RESTAURAR';
  }

  restaurar(): void {
    if (!this.archivo() || !this.confirmacionValida() || this.restaurando()) return;
    this.restaurando.set(true);
    this.service.importar(this.archivo()!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: ImportarBackupResult) => {
        this.restaurando.set(false);
        this.snackbar.open(res.mensaje || 'Backup restaurado', 'Cerrar', { duration: 4000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.restaurando.set(false);
        this.snackbar.open(err.error?.detail || 'Error al restaurar el backup', 'Cerrar', { duration: 5000 });
      },
    });
  }

  cancelar(): void {
    if (this.restaurando()) return;
    this.dialogRef.close(false);
  }
}
