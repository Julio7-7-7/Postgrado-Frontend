import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotaService } from '../../services/nota.service';
import { ProgramaVersionEdicionResponse } from '../../../documentacion/models/documentacion.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-notas-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './notas-admin.html',
  styleUrl: './notas-admin.css',
})
export class NotasAdminComponent implements OnInit {
  private notaService = inject(NotaService);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  apiUrl = environment.apiUrl;

  ediciones = signal<ProgramaVersionEdicionResponse[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.notaService.getEdiciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  irANotas(ed: ProgramaVersionEdicionResponse): void {
    this.router.navigate(['/notas', ed.id_programa_version_edicion]);
  }

  getFotoUrl(foto: string | null): string {
    return foto ? `${this.apiUrl}${foto}` : '';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
