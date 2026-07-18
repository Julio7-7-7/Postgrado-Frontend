import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DocumentacionService } from '../../services/documentacion.service';
import {
  PostulanteResponse,
  RequisitoColumn,
} from '../../models/documentacion.model';
import { DocMatrizDialogComponent } from '../doc-matriz-dialog/doc-matriz-dialog';

@Component({
  selector: 'app-doc-matriz',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatProgressBarModule,
    MatSnackBarModule, MatDialogModule,
  ],
  templateUrl: './doc-matriz.html',
  styleUrl: './doc-matriz.css',
})
export class DocMatrizComponent implements OnInit {
  private service = inject(DocumentacionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  postulantes = signal<PostulanteResponse[]>([]);
  isLoading = signal(true);
  requisitos = signal<RequisitoColumn[]>([]);

  totalAprobados = computed(() =>
    this.postulantes().filter(p => p.docs_completados === p.docs_total && p.docs_total > 0).length
  );

  totalEnRevision = computed(() =>
    this.postulantes().filter(p =>
      p.estado !== 'retirado' && p.docs_completados < p.docs_total && p.docs_completados > 0
    ).length
  );

  totalSinAvance = computed(() =>
    this.postulantes().filter(p =>
      p.estado !== 'retirado' && p.docs_completados === 0
    ).length
  );

  totalRetirados = computed(() =>
    this.postulantes().filter(p => p.estado === 'retirado').length
  );

  ngOnInit(): void {
    const idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!idEdicion) {
      this.router.navigate(['/admin/documentacion']);
      return;
    }

    this.service.getPostulantesPorEdicion(idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.postulantes.set(data);
        this.extraerRequisitos(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar postulantes', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private extraerRequisitos(data: PostulanteResponse[]): void {
    const seen = new Map<number, string>();
    for (const p of data) {
      for (const doc of p.control_documentacion) {
        if (!seen.has(doc.id_requisito)) {
          seen.set(doc.id_requisito, doc.requisito_nombre || `Requisito #${doc.id_requisito}`);
        }
      }
    }
    this.requisitos.set(
      Array.from(seen.entries()).map(([id, nombre]) => ({ id, nombre }))
    );
  }

  getCeldaEstado(p: PostulanteResponse, reqId: number): string {
    const doc = p.control_documentacion.find(d => d.id_requisito === reqId);
    return doc?.estado || 'sin_doc';
  }

  cellIcon(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'radio_button_unchecked',
      entregado: 'schedule',
      aceptado: 'check_circle',
      rechazado: 'cancel',
      sin_doc: 'remove',
    };
    return map[estado] || 'help_outline';
  }

  progresoPct(p: PostulanteResponse): number {
    if (p.docs_total === 0) return 0;
    return Math.round((p.docs_completados / p.docs_total) * 100);
  }

  iniciales(p: PostulanteResponse): string {
    if (!p.alumno) return '??';
    return (p.alumno.nombre[0] + p.alumno.apellido[0]).toUpperCase();
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'estado-postulante',
      observado: 'estado-observado',
      inscrito: 'estado-inscrito',
      en_curso: 'estado-en_curso',
      finalizado: 'estado-finalizado',
      retirado: 'estado-retirado',
    };
    return map[estado] || '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'Postulante',
      observado: 'Observado',
      inscrito: 'Inscrito',
      en_curso: 'En Curso',
      finalizado: 'Finalizado',
      retirado: 'Retirado',
    };
    return map[estado] || estado;
  }

  openDetail(p: PostulanteResponse, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DocMatrizDialogComponent, {
      width: '780px',
      maxHeight: '85vh',
      data: { postulante: p, requisitos: this.requisitos() },
      panelClass: 'doc-matriz-dialog',
    });

    dialogRef.afterClosed().subscribe(updated => {
      if (updated) {
        this.replacePostulante(updated);
      }
    });
  }

  private replacePostulante(updated: PostulanteResponse): void {
    const current = this.postulantes().map(p =>
      p.id_detalle_programa_alumno === updated.id_detalle_programa_alumno ? updated : p
    );
    this.postulantes.set(current);
  }

  volver(): void {
    this.router.navigate(['/admin/documentacion']);
  }
}
