import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { EdicionService } from '../../services/edicion.service';
import { ProgramaVersionEdicion } from '../../models/edicion.model';
import { PostulanteResponse } from '../../../documentacion/models/documentacion.model';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import { nombreCompleto } from '../../../../core/utils/nombre-utils';

@Component({
  selector: 'app-edicion-postulantes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatProgressBarModule,
    MatTableModule, MatSnackBarModule,
  ],
  templateUrl: './edicion-postulantes.html',
  styleUrl: './edicion-postulantes.css',
})
export class EdicionPostulantesComponent implements OnInit {
  private edicionService = inject(EdicionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private navBack = inject(NavigationBackService);

  nombreCompleto = nombreCompleto;

  edicion = signal<ProgramaVersionEdicion | null>(null);
  postulantes = signal<PostulanteResponse[]>([]);
  isLoading = signal(true);
  expandedId = signal<number | null>(null);

  ngOnInit(): void {
    const eid = Number(this.route.snapshot.paramMap.get('edicionId'));
    if (!eid) {
      this.router.navigate(['/programas']);
      return;
    }

    this.edicionService.getById(eid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.edicion.set(data),
    });

    this.edicionService.getPostulantes(eid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.postulantes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar postulantes', 'Cerrar', { duration: 3000 });
      },
    });
  }

  volver(): void {
    const m = this.router.url.match(/^(\/programas\/\d+\/versiones(?:\/\d+)?\/ediciones)/);
    this.navBack.retornar(m ? m[1] : ['/programas']);
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  iniciales(p: PostulanteResponse): string {
    if (!p.alumno) return '??';
    return (p.alumno.nombre[0] + p.alumno.apellido[0]).toUpperCase();
  }

  docsAceptados(p: PostulanteResponse): number {
    return p.control_documentacion.filter(c => c.estado === 'aceptado').length;
  }

  docsEntregados(p: PostulanteResponse): number {
    return p.control_documentacion.filter(c => c.estado === 'entregado').length;
  }

  progresoPct(p: PostulanteResponse): number {
    const total = p.docs_total;
    if (total === 0) return 0;
    return Math.round((p.docs_completados / total) * 100);
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      postulante: 'pendiente',
      observado: 'pendiente',
      inscrito: 'activo',
      incorporado: 'programado',
      finalizado: 'finalizado',
      retirado: 'truncado',
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
}
