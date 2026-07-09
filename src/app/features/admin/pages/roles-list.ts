import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../services/admin.service';
import { RolResponse } from '../models/admin.models';
import { RolFormComponent } from './rol-form';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule,
  ],
  template: `
    <div class="roles-toolbar">
      <h2>Roles</h2>
      <button mat-raised-flat color="primary" (click)="abrirFormulario()">
        <mat-icon>add</mat-icon> Nuevo Rol
      </button>
    </div>

    @if (isLoading()) {
      <div class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    } @else if (error()) {
      <div class="error-container">
        <p>{{ error() }}</p>
        <button mat-raised-flat (click)="cargarDatos()">Reintentar</button>
      </div>
    } @else {
      <table mat-table [dataSource]="roles()" class="mat-elevation-z2">
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Rol</th>
          <td mat-cell *matCellDef="let r">
            <strong>{{ r.nombre }}</strong>
            @if (r.descripcion) {
              <br><span class="descripcion">{{ r.descripcion }}</span>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="permisos">
          <th mat-header-cell *matHeaderCellDef>Permisos</th>
          <td mat-cell *matCellDef="let r">
            <span class="permiso-count">{{ r.permisos.length }} permisos</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">
            <button mat-icon-button matTooltip="Editar rol" (click)="abrirFormulario(r)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Eliminar rol"
                    [disabled]="r.id_rol <= 7"
                    (click)="eliminarRol(r)">
              <mat-icon color="warn">delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
      </table>

      @if (roles().length === 0) {
        <div class="empty">No hay roles registrados</div>
      }
    }
  `,
  styles: [`
    .roles-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .roles-toolbar h2 { margin: 0; }
    .loading-container, .error-container, .empty { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; }
    table { width: 100%; }
    .descripcion { font-size: 0.85em; color: var(--mat-table-text-color, rgba(0,0,0,0.6)); }
    .permiso-count { background: var(--mat-chip-container-background-color, #e8eaf6); padding: 4px 12px; border-radius: 16px; font-size: 0.85em; }
  `],
})
export class RolesListComponent implements OnInit {
  private service = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  roles = signal<RolResponse[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  columnas = ['nombre', 'permisos', 'acciones'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.service.getAllRoles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  eliminarRol(rol: RolResponse): void {
    if (!confirm(`¿Eliminar el rol "${rol.nombre}"?`)) return;
    this.service.deleteRol(rol.id_rol).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.open('Rol eliminado', 'Cerrar', { duration: 3000 });
        this.cargarDatos();
      },
      error: err => this.snackbar.open(err.error?.detail || 'Error al eliminar', 'Cerrar', { duration: 4000 }),
    });
  }
}
