import { Component, OnInit, signal, inject, DestroyRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DocumentacionService } from '../../../documentacion/services/documentacion.service';
import { ProgramaVersionEdicionResponse } from '../../../documentacion/models/documentacion.model';
import { PagoService } from '../../services/pago.service';
import { BusquedaPagosItem } from '../../models/pago.model';
import { OrdenPagoDialog } from '../orden-pago-dialog/orden-pago-dialog';
import { environment } from '../../../../../environments/environment';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';

@Component({
  selector: 'app-pagos-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule, MatDialogModule,
  ],
  templateUrl: './pagos-admin.html',
  styleUrl: './pagos-admin.css',
})
export class PagosAdminComponent implements OnInit {
  private docService = inject(DocumentacionService);
  private service = inject(PagoService);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private navBack = inject(NavigationBackService);

  @ViewChild('busquedaInput', { read: ElementRef }) private busquedaInput!: ElementRef<HTMLInputElement>;

  apiUrl = environment.apiUrl;

  ediciones = signal<ProgramaVersionEdicionResponse[]>([]);
  isLoading = signal(true);

  busqueda = signal('');
  resultados = signal<BusquedaPagosItem[]>([]);
  buscando = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit(): void {
    this.docService.getEdiciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.ediciones.set(data.filter(e => e.estado !== 'finalizado'));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar ediciones', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onBusqueda(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.busqueda.set(v);
    if (v.trim().length < 2) {
      this.resultados.set([]);
      this.buscando.set(false);
      clearTimeout(this.timer);
      return;
    }
    this.buscando.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.ejecutarBusqueda(v.trim()), 400);
  }

  limpiarBusqueda(): void {
    clearTimeout(this.timer);
    this.busqueda.set('');
    this.resultados.set([]);
    this.buscando.set(false);
    this.busquedaInput?.nativeElement.focus();
  }

  private ejecutarBusqueda(q: string): void {
    this.service.buscarAlumnos(q).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resp => {
        this.resultados.set(resp.items);
        this.buscando.set(false);
      },
      error: () => {
        this.buscando.set(false);
        this.snackbar.open('Error al buscar alumno', 'Cerrar', { duration: 3000 });
      },
    });
  }

  abrirOrdenBusqueda(r: BusquedaPagosItem): void {
    const dialogRef = this.dialog.open(OrdenPagoDialog, {
      width: '560px',
      data: {
        alumno: r,
        modulos: r.modulos,
        matricula: r.matricula_precio,
        precio: r.precio,
        orden: r.orden_activa,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      const q = this.busqueda().trim();
      if (q.length >= 2) {
        this.buscando.set(true);
        this.ejecutarBusqueda(q);
      }
    });
  }

  programaNombre(ed: ProgramaVersionEdicionResponse): string {
    return ed.programa_version?.programa?.nombre_programa || `Programa #${ed.programa_version?.id_programa_version}`;
  }

  tipoPrograma(ed: ProgramaVersionEdicionResponse): string {
    return ed.programa_version?.programa?.tipo_programa?.nombre || '';
  }

  gestionLabel(ed: ProgramaVersionEdicionResponse): string {
    const parts: string[] = [];
    if (ed.edicion) parts.push(`Ed. ${ed.edicion}`);
    if (ed.anio) parts.push(`${ed.anio}`);
    return parts.join(' — ') || 'Sin gestión';
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      programado: 'estado-programado',
      en_curso: 'estado-en_curso',
      reprogramado: 'estado-reprogramado',
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

  irAPagos(ed: ProgramaVersionEdicionResponse): void {
    this.navBack.setReturn(this.router.url);
    this.router.navigate(['/pagos', ed.id_programa_version_edicion]);
  }

  getFotoUrl(foto: string | null): string {
    return foto ? `${this.apiUrl}${foto}` : '';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  nombreAlumno(r: BusquedaPagosItem): string {
    return r.alumno ? `${r.alumno.apellido} ${r.alumno.nombre}` : 'Alumno sin datos';
  }

  iniciales(r: BusquedaPagosItem): string {
    const ap = (r.alumno?.apellido || '').trim();
    const nm = (r.alumno?.nombre || '').trim();
    return `${ap.charAt(0)}${nm.charAt(0)}`.toUpperCase() || '—';
  }

  etiquetaEdicion(r: BusquedaPagosItem): string {
    const parts: string[] = [];
    if (r.edicion) parts.push(`Ed. ${r.edicion}`);
    if (r.anio) parts.push(`${r.anio}`);
    if (r.semestre) parts.push(`Sem. ${r.semestre}`);
    return parts.join(' · ');
  }

  debe(r: BusquedaPagosItem): number {
    return Math.max(0, r.total_esperado - r.total_pagado);
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
