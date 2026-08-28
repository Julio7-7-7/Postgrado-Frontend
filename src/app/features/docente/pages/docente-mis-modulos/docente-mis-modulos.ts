import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotaService } from '../../../notas/services/nota.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import { DocenteEdicionCompleta, DocenteModuloResumen } from '../../../notas/models/nota.model';

@Component({
  selector: 'app-docente-mis-modulos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './docente-mis-modulos.html',
  styleUrl: './docente-mis-modulos.css',
})
export class DocenteMisModulosComponent implements OnInit {
  private service = inject(NotaService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private navBack = inject(NavigationBackService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  ediciones = signal<DocenteEdicionCompleta[]>([]);
  isLoading = signal(true);
  idDocente = 0;

  ngOnInit(): void {
    this.idDocente = Number(this.auth.user()?.id_profile) || 0;
    if (!this.idDocente) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.service.getNotasPorDocente(this.idDocente).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.ediciones.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackbar.open('Error al cargar módulos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  gestionarModulo(mod: DocenteModuloResumen): void {
    this.navBack.setReturn(this.router.url);
    this.router.navigate(['/docente/calificar', mod.id_detalle_programa_modulo]);
  }

  semestreLabel(sem: number): string {
    return sem === 1 ? 'I' : 'II';
  }

  estadoModuloClass(estado: string): string {
    const map: Record<string, string> = {
      programado: 'programado',
      en_curso: 'en-curso',
      reprogramado: 'reprogramado',
      finalizado: 'finalizado',
    };
    return map[estado] || '';
  }

  estadoEdicionClass(estado: string): string {
    const map: Record<string, string> = {
      programado: 'programado',
      en_curso: 'en-curso',
      reprogramado: 'reprogramado',
      finalizado: 'finalizado',
    };
    return map[estado] || '';
  }

  volver(): void {
    this.navBack.retornar(['/docente']);
  }
}
