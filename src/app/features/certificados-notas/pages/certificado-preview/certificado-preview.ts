import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CertificadoService } from '../../services/certificado.service';
import { NavigationBackService } from '../../../../core/navigation/navigation-back.service';
import { CertificadoNotas, CertificadoDatos, CertificadoModulo } from '../../models/certificado.model';

@Component({
  selector: 'app-certificado-preview',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './certificado-preview.html',
  styleUrl: './certificado-preview.css',
})
export class CertificadoPreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CertificadoService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private navBack = inject(NavigationBackService);

  cert = signal<CertificadoNotas | null>(null);
  cargando = signal(false);
  impresoLabel = signal('');

  datos = computed<CertificadoDatos | null>(() => this.cert()?.datos ?? null);

  ngOnInit(): void {
    const idParam = Number(this.route.snapshot.queryParamMap.get('id'));
    if (!idParam) {
      this.snackBar.open('Certificado no encontrado', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/certificados-notas']);
      return;
    }
    this.cargando.set(true);
    this.service.obtener(idParam).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: cert => {
        this.cert.set(cert);
        this.cargando.set(false);
        this.impresoLabel.set(this.ahoraDisplay());
        this.service.imprimir(cert.id_certificado).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: res => this.cert.set({ ...cert, n_impresiones: res.n_impresiones }),
          error: () => undefined,
        });
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Certificado no encontrado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/certificados-notas']);
      },
    });
  }

  volver(): void {
    const c = this.cert();
    this.navBack.retornar(['/certificados-notas'], {
      queryParams: { edicion: c?.id_programa_version_edicion ?? undefined },
    });
  }

  imprimir(): void {
    window.print();
  }

  clasificarLabel(c: CertificadoModulo): string {
    if (c.nota === null) return 'Sin nota';
    return c.aprobada ? 'Aprobado' : 'Reprobado';
  }

  promedioLabel(p: number | null): string {
    if (p === null) return '—';
    return String(p);
  }

  fmtDia(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  fmtMesLargo(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }

  private ahoraDisplay(): string {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${this.fmtDia(d.toISOString().slice(0, 10))} a las ${h}:${min}`;
  }
}