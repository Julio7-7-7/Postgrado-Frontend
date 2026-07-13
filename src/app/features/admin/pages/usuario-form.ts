import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import { RolResponse, UserAdminCreate } from '../models/admin.models';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>person_add</mat-icon>
      </div>
      <div>
        <h2 mat-dialog-title>Nuevo Usuario</h2>
        <p class="header-sub">Creá una cuenta con sus roles y datos personales</p>
      </div>
    </div>

    <mat-dialog-content>
      <div class="section-card">
        <div class="section-label">
          <mat-icon>email</mat-icon>
          Credenciales de acceso
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput [(ngModel)]="email" type="email" placeholder="usuario@ejemplo.com" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width no-margin">
          <mat-label>Contraseña</mat-label>
          <input matInput [(ngModel)]="password" type="password" placeholder="Mínimo 6 caracteres" required minlength="6">
        </mat-form-field>
      </div>

      <div class="section-card">
        <div class="section-label">
          <mat-icon>shield</mat-icon>
          Roles del sistema
          <span class="roles-badge">{{ rolesSeleccionadosCount() }} seleccionados</span>
        </div>

        <div class="roles-list">
          @for (r of roles(); track r.id_rol) {
            <label class="role-chip" [class.selected]="rolesSeleccionados[r.id_rol]">
              <mat-checkbox [(ngModel)]="rolesSeleccionados[r.id_rol]"></mat-checkbox>
              <span class="role-name">{{ r.nombre }}</span>
              @if (r.descripcion) {
                <span class="role-sep">—</span>
                <span class="role-desc">{{ r.descripcion }}</span>
              }
            </label>
          }
        </div>
      </div>

      <div class="section-card">
        <div class="section-label">
          <mat-icon>badge</mat-icon>
          Datos personales
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half">
            <mat-label>Nombre</mat-label>
            <input matInput [(ngModel)]="nombre" required>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half">
            <mat-label>Apellido</mat-label>
            <input matInput [(ngModel)]="apellido" required>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half">
            <mat-label>CI</mat-label>
            <input matInput [(ngModel)]="ci" placeholder="Carnet de identidad" required>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half">
            <mat-label>Celular</mat-label>
            <input matInput [(ngModel)]="celular" placeholder="Opcional">
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="btn-cancel">Cancelar</button>
      <button mat-raised-button color="primary"
              [disabled]="!puedeGuardar() || guardando()"
              (click)="guardar()">
        @if (guardando()) {
          <mat-spinner diameter="16"></mat-spinner> Creando...
        } @else {
          <mat-icon>person_add</mat-icon> Crear Usuario
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px 0;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0891b2, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: white;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
    }

    .header-sub {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    mat-dialog-content {
      padding-top: 16px !important;
    }

    .section-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 12px;
    }

    .section-label mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #0891b2;
    }

    .roles-badge {
      margin-left: auto;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      background: #ecfeff;
      color: #0891b2;
    }

    .full-width { width: 100%; }
    .no-margin { margin-bottom: 0 !important; }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .half { flex: 1; }

    .roles-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .role-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      background: white;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .role-chip:hover {
      border-color: #cbd5e1;
    }

    .role-chip.selected {
      border-color: #0891b2;
      background: #ecfeff;
    }

    .role-name {
      font-weight: 600;
      font-size: 0.88rem;
      color: #1e293b;
    }

    .role-sep {
      color: #cbd5e1;
    }

    .role-desc {
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .btn-cancel {
      color: #64748b;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
})
export class UsuarioFormComponent implements OnInit {
  private service = inject(AdminService);
  private snackbar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<UsuarioFormComponent>);
  private destroyRef = inject(DestroyRef);

  roles = signal<RolResponse[]>([]);
  guardando = signal(false);
  rolesSeleccionados: Record<number, boolean> = {};

  email = '';
  password = '';
  nombre = '';
  apellido = '';
  ci = '';
  celular = '';

  rolesSeleccionadosCount(): number {
    return Object.values(this.rolesSeleccionados).filter(v => v).length;
  }

  toggleRol(id: number): void {
    this.rolesSeleccionados[id] = !this.rolesSeleccionados[id];
  }

  ngOnInit(): void {
    this.service.getAllRoles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.roles.set(data);
        for (const r of data) {
          this.rolesSeleccionados[r.id_rol] = false;
        }
      },
      error: () => this.snackbar.open('Error al cargar roles', 'Cerrar', { duration: 3000 }),
    });
  }

  puedeGuardar(): boolean {
    const rolesSeleccionados = Object.entries(this.rolesSeleccionados)
      .filter(([_, seleccionado]) => seleccionado)
      .map(([id]) => Number(id));
    return !!(this.email && this.password.length >= 6 && rolesSeleccionados.length > 0
      && this.nombre && this.apellido && this.ci);
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;
    this.guardando.set(true);

    const rolesSeleccionados = Object.entries(this.rolesSeleccionados)
      .filter(([_, seleccionado]) => seleccionado)
      .map(([id]) => Number(id));

    const data: UserAdminCreate = {
      email: this.email,
      password: this.password,
      roles: rolesSeleccionados,
      nombre: this.nombre,
      apellido: this.apellido,
      ci: this.ci,
      celular: this.celular || null,
    };

    this.service.createUser(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.open('Usuario creado', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.guardando.set(false);
        this.snackbar.open(err.error?.detail || 'Error al crear usuario', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
