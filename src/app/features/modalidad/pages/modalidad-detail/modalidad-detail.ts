import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModalidadService } from '../../services/modalidad.service';
import { ModalidadAcademicaResponse } from '../../models/modalidad.model';

@Component({
  selector: 'app-modalidad-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './modalidad-detail.html',
  styleUrl: './modalidad-detail.css',
})
export class ModalidadDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ModalidadService);

  modalidad = signal<ModalidadAcademicaResponse | null>(null);
  cargando = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.cargando.set(false);
      return;
    }

    this.service.getById(id).subscribe({
      next: (m) => {
        this.modalidad.set(m);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}
