import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { nombreCompleto } from '../../../../core/utils/nombre-utils';
import { DocenteService } from '../../services/docente.service';
import { Docente } from '../../models/docente.model';

@Component({
  selector: 'app-docente-portal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './docente-portal.html',
  styleUrl: './docente-portal.css',
})
export class DocentePortalComponent implements OnInit {
  private auth = inject(AuthService);
  private service = inject(DocenteService);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  nombreCompleto = nombreCompleto;

  docente = signal<Docente | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const idDocente = this.auth.user()?.id_profile;
    if (!idDocente) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarDatos(idDocente);
  }

  private cargarDatos(id: number): void {
    this.loading.set(true);
    this.service.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: docente => {
        this.docente.set(docente);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.open('Error al cargar tu perfil', 'Cerrar', { duration: 4000 });
      },
    });
  }

  iniciales(): string {
    const d = this.docente();
    if (!d) return '';
    return (d.nombre.charAt(0) + d.apellido.charAt(0)).toUpperCase();
  }

  irAMisModulos(): void {
    this.router.navigate(['/docente/mis-modulos']);
  }
}
