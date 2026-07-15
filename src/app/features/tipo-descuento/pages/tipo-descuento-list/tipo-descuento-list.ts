import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TipoDescuentoService } from '../../services/tipo-descuento.service';
import { TipoDescuentoResponse } from '../../models/tipo-descuento.model';
import { TipoDescuentoFormComponent } from '../tipo-descuento-form/tipo-descuento-form';

@Component({
  selector: 'app-tipo-descuento-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './tipo-descuento-list.html',
  styleUrl: './tipo-descuento-list.css',
})
export class TipoDescuentoListComponent implements OnInit {
  private service = inject(TipoDescuentoService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  descuentos = signal<TipoDescuentoResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.descuentos.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Error al cargar descuentos'); this.isLoading.set(false); },
    });
  }

  abrirFormulario(descuento?: TipoDescuentoResponse): void {
    const ref = this.dialog.open(TipoDescuentoFormComponent, {
      width: '640px',
      data: descuento ?? null,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      if (r) this.cargar();
    });
  }
}
