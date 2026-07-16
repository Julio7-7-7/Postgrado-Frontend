import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RequisitoService } from '../../services/requisito.service';
import { RequisitoResponse } from '../../models/requisito.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-requisito-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './requisito-detail.html',
  styleUrl: './requisito-detail.css',
})
export class RequisitoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(RequisitoService);

  requisito = signal<RequisitoResponse | null>(null);
  cargando = signal(true);
  apiUrl = environment.apiUrl;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.cargando.set(false);
      return;
    }

    this.service.getById(id).subscribe({
      next: (r: RequisitoResponse) => {
        this.requisito.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  getImagenUrl(): string | null {
    const r = this.requisito();
    if (!r?.imagen_url) return null;
    if (r.imagen_url.startsWith('http')) return r.imagen_url;
    return this.apiUrl + r.imagen_url;
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}
