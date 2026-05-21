import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ProgramaService } from '../../services/programa.service';
import { Programa } from '../../models/programa.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-programa-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: './programa-list.html',
  styleUrl: './programa-list.css',
})
export class ProgramaListComponent implements OnInit {
  private service = inject(ProgramaService);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  apiUrl = environment.apiUrl;
  listaTotal = signal<Programa[]>([]);
  terminoBusqueda = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);

  listaActivos = computed(() =>
    this.listaTotal()
      .filter(p => p.estado === 'activo' && p.nombre_programa.toLowerCase().includes(this.terminoBusqueda().toLowerCase()))
      .sort((a, b) => a.nombre_programa.localeCompare(b.nombre_programa)),
  );

  listaInactivos = computed(() =>
    this.listaTotal()
      .filter(p => p.estado === 'inactivo' && p.nombre_programa.toLowerCase().includes(this.terminoBusqueda().toLowerCase()))
      .sort((a, b) => a.nombre_programa.localeCompare(b.nombre_programa)),
  );

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.service.getAll().subscribe({
      next: data => {
        this.listaTotal.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo establecer conexión con el servidor.');
        this.isLoading.set(false);
        this.snackbar.open('Error al sincronizar datos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  getFotoUrl(foto: string | null): string {
    return foto ? `${this.apiUrl}${foto}` : '';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  irAVersiones(id: number): void {
    this.router.navigate([id, 'versiones'], { relativeTo: this.route });
  }
}
