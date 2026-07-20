import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InscripcionEdicionService } from '../../services/inscripcion-edicion.service';
import { InscripcionEdicionItem } from '../../models/inscripcion-edicion.model';
import { TransferDialogComponent } from '../../dialogs/transfer-dialog/transfer-dialog';

@Component({
  selector: 'app-inscripciones-edicion',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatSnackBarModule, MatDialogModule,
  ],
  templateUrl: './inscripcion-edicion.html',
  styleUrl: './inscripcion-edicion.css',
})
export class InscripcionesEdicionComponent implements OnInit {
  private service = inject(InscripcionEdicionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  items = signal<InscripcionEdicionItem[]>([]);
  isLoading = signal(true);
  total = signal(0);
  page = signal(1);
  pages = signal(1);
  perPage = 20;

  filtroEstado = signal<string>('');
  busqueda = signal('');
  busquedaTimeout: ReturnType<typeof setTimeout> | null = null;

  idEdicion = 0;

  ngOnInit(): void {
    this.idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!this.idEdicion) {
      this.router.navigate(['/admin/inscripciones']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    const search = this.busqueda() || undefined;
    const estado = this.filtroEstado() || undefined;
    this.service.getPorEdicion(this.idEdicion, this.page(), this.perPage, estado, search)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.items.set(data.items);
          this.total.set(data.total);
          this.pages.set(data.pages);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackbar.open('Error al cargar inscripciones', 'Cerrar', { duration: 3000 });
        },
      });
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
    if (this.busquedaTimeout) clearTimeout(this.busquedaTimeout);
    this.busquedaTimeout = setTimeout(() => {
      this.page.set(1);
      this.cargarDatos();
    }, 400);
  }

  onFiltroEstado(value: string): void {
    this.filtroEstado.set(value);
    this.page.set(1);
    this.cargarDatos();
  }

  irAPagina(p: number): void {
    if (p < 1 || p > this.pages()) return;
    this.page.set(p);
    this.cargarDatos();
  }

  paginasVisibles(): number[] {
    const total = this.pages();
    const current = this.page();
    const range: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  volver(): void {
    this.router.navigate(['/admin/inscripciones']);
  }

  iniciales(item: InscripcionEdicionItem): string {
    return (item.alumno.nombre[0] + item.alumno.apellido[0]).toUpperCase();
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'estado-postulante',
      inscrito: 'estado-inscrito',
      en_curso: 'estado-en_curso',
      finalizado: 'estado-finalizado',
      observado: 'estado-observado',
      retirado: 'estado-retirado',
      graduado: 'estado-graduado',
      titulado: 'estado-titulado',
    };
    return map[estado] || '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'Postulante',
      inscrito: 'Inscrito',
      en_curso: 'En Curso',
      incorporado: 'Incorporado',
      finalizado: 'Finalizado',
      observado: 'Observado',
      retirado: 'Retirado',
      graduado: 'Graduado',
      titulado: 'Titulado',
    };
    return map[estado] || estado;
  }

  canTransferir(item: InscripcionEdicionItem): boolean {
    return item.estado === 'en_curso' || item.estado === 'incorporado';
  }

  abrirTransferir(item: InscripcionEdicionItem): void {
    const dialogRef = this.dialog.open(TransferDialogComponent, {
      width: '520px',
      data: { inscripcion: item },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.cargarDatos();
    });
  }

  verTranscript(item: InscripcionEdicionItem): void {
    this.router.navigate(['/admin/transcript', item.alumno.id_alumno]);
  }
}
