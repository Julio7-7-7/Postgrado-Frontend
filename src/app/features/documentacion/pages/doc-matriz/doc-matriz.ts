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

export interface GrupoModalidad {
  id_modalidad: number;
  nombre: string;
  requisitos: RequisitoColumn[];
  postulantes: PostulanteResponse[];
}

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
  allPostulantes = signal<PostulanteResponse[]>([]);
  grupos = signal<GrupoModalidad[]>([]);
  isLoading = signal(true);
  filtroEstado = signal('');

  total = computed(() => this.postulantes().length);
  countSinAvance = computed(() => this.allPostulantes().filter(p => p.docs_completados === 0).length);
  countEnRevision = computed(() => this.allPostulantes().filter(p => p.docs_completados > 0 && p.docs_completados < p.docs_total).length);
  countAprobados = computed(() => this.allPostulantes().filter(p => p.docs_completados === p.docs_total && p.docs_total > 0).length);

  ngOnInit(): void {
    const idEdicion = Number(this.route.snapshot.paramMap.get('idEdicion'));
    if (!idEdicion) {
      this.router.navigate(['/admin/documentacion']);
      return;
    }

    this.service.getPostulantesPorEdicion(idEdicion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.allPostulantes.set(data);
        this.aplicarFiltro();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar postulantes', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private agruparPorModalidad(data: PostulanteResponse[]): void {
    const map = new Map<number, { nombre: string; postulantes: PostulanteResponse[] }>();

    for (const p of data) {
      const key = p.id_modalidad_academica;
      if (!map.has(key)) {
        map.set(key, { nombre: p.nombre_modalidad, postulantes: [] });
      }
      map.get(key)!.postulantes.push(p);
    }

    const result: GrupoModalidad[] = [];
    for (const [id, grupo] of map) {
      const seen = new Map<number, string>();
      for (const p of grupo.postulantes) {
        for (const doc of p.control_documentacion) {
          if (!seen.has(doc.id_requisito)) {
            seen.set(doc.id_requisito, doc.requisito_nombre || `Requisito #${doc.id_requisito}`);
          }
        }
      }
      result.push({
        id_modalidad: id,
        nombre: grupo.nombre,
        requisitos: Array.from(seen.entries())
          .filter(([, nombre]) => nombre !== 'Carta de Solicitud de Incorporación')
          .map(([rid, nombre]) => ({ id: rid, nombre })),
        postulantes: grupo.postulantes,
      });
    }

    this.grupos.set(result);
  }

  aplicarFiltro(): void {
    const filtro = this.filtroEstado();
    const all = this.allPostulantes();
    let filtered: PostulanteResponse[];

    if (!filtro) {
      filtered = all;
    } else if (filtro === 'sin_avance') {
      filtered = all.filter(p => p.docs_completados === 0);
    } else if (filtro === 'en_revision') {
      filtered = all.filter(p => p.docs_completados > 0 && p.docs_completados < p.docs_total);
    } else if (filtro === 'aprobados') {
      filtered = all.filter(p => p.docs_completados === p.docs_total && p.docs_total > 0);
    } else {
      filtered = all;
    }

    this.postulantes.set(filtered);
    this.agruparPorModalidad(filtered);
  }

  onFiltroEstado(value: string): void {
    this.filtroEstado.set(value);
    this.aplicarFiltro();
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
      incorporado: 'estado-incorporado',
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
      incorporado: 'Incorporado',
      finalizado: 'Finalizado',
      retirado: 'Retirado',
    };
    return map[estado] || estado;
  }

  openDetail(p: PostulanteResponse, event: MouseEvent, requisitosGrupo: RequisitoColumn[]): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DocMatrizDialogComponent, {
      width: '780px',
      maxHeight: '85vh',
      data: { postulante: p, requisitos: requisitosGrupo },
      panelClass: 'doc-matriz-dialog',
      disableClose: true,
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
    this.agruparPorModalidad(current);
  }

  volver(): void {
    this.router.navigate(['/admin/documentacion']);
  }
}
