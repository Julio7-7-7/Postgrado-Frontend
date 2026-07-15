import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RolesService } from '../../services/roles.service';
import { RolResponse } from '../../models/roles.model';
import { RolFormComponent } from '../rol-form/rol-form';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './roles-list.html',
  styleUrl: './roles-list.css',
})
export class RolesListComponent implements OnInit {
  private service = inject(RolesService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  roles = signal<RolResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.roles.set(data); this.isLoading.set(false); },
      error: () => {
        this.error.set('Error al cargar roles');
        this.isLoading.set(false);
      },
    });
  }

  abrirFormulario(rol?: RolResponse): void {
    const dialogRef = this.dialog.open(RolFormComponent, {
      width: '700px',
      data: rol ?? null,
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.cargarDatos();
    });
  }
}
