import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ModalidadService } from '../../services/modalidad.service';
import { ModalidadAcademicaResponse } from '../../models/modalidad.model';
import { ModalidadFormComponent } from '../modalidad-form/modalidad-form';

@Component({
  selector: 'app-modalidad-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './modalidad-list.html',
  styleUrl: './modalidad-list.css',
})
export class ModalidadListComponent implements OnInit {
  private service = inject(ModalidadService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  modalidades = signal<ModalidadAcademicaResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.modalidades.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar modalidades'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(modalidad?: ModalidadAcademicaResponse): void {
    const ref = this.dialog.open(ModalidadFormComponent, {
      width: '640px',
      data: modalidad ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      if (r) this.cargar();
    });
  }
}
