import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PagoService } from '../../services/pago.service';
import { AlumnoPagos, PagoResponse } from '../../models/pago.model';
import { PagoRegisterDialog } from '../pago-register-dialog/pago-register-dialog';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-pagos-edicion',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
  ],
  templateUrl: './pagos-edicion.html',
  styleUrl: './pagos-edicion.css',
})
export class PagosEdicionComponent implements OnInit {
  private service = inject(PagoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  alumnos = signal<AlumnoPagos[]>([]);
  isLoading = signal(true);
  expandedId = signal<number | null>(null);
  idEdicion = 0;
  apiUrl = environment.apiUrl;

  ngOnInit(): void {
    this.idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!this.idEdicion) {
      this.router.navigate(['/admin/pagos']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.service.getPagosPorEdicion(this.idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.alumnos.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar pagos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  toggleExpand(a: AlumnoPagos): void {
    const newId = this.expandedId() === a.id_detalle_programa_alumno ? null : a.id_detalle_programa_alumno;
    this.expandedId.set(newId);
  }

  iniciales(a: AlumnoPagos): string {
    if (!a.alumno) return '??';
    return (a.alumno.nombre[0] + a.alumno.apellido[0]).toUpperCase();
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'estado-pendiente',
      confirmado: 'estado-confirmado',
      rechazado: 'estado-rechazado',
    };
    return map[estado] || '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      rechazado: 'Rechazado',
    };
    return map[estado] || estado;
  }

  registrarPago(a: AlumnoPagos, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(PagoRegisterDialog, {
      width: '480px',
      data: { idDetalle: a.id_detalle_programa_alumno, alumno: a.alumno },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  confirmarPago(pago: PagoResponse, event: MouseEvent): void {
    event.stopPropagation();
    this.service.update(pago.id_pago, { estado: 'confirmado' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.cargarDatos();
        this.snackbar.open('Pago confirmado', 'Cerrar', { duration: 1500 });
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
    });
  }

  rechazarPago(pago: PagoResponse, event: MouseEvent): void {
    event.stopPropagation();
    this.service.update(pago.id_pago, { estado: 'rechazado' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.cargarDatos();
        this.snackbar.open('Pago rechazado', 'Cerrar', { duration: 1500 });
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error', 'Cerrar', { duration: 3000 }),
    });
  }

  verComprobante(url: string, event: MouseEvent): void {
    event.stopPropagation();
    window.open(`${this.apiUrl}${url}`, '_blank');
  }

  volver(): void {
    this.router.navigate(['/admin/pagos']);
  }
}
