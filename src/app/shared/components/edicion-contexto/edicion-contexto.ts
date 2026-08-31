import { Component, Input, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdicionService } from '../../../features/edicion/services/edicion.service';

@Component({
  selector: 'app-edicion-contexto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edicion-contexto.html',
  styleUrl: './edicion-contexto.css',
})
export class EdicionContextoComponent implements OnInit {
  @Input({ required: true }) idEdicion = 0;

  private edicionService = inject(EdicionService);

  cargando = signal(true);
  error = signal(false);
  datos = signal<{ programa: string; version: number; edicion: number; anio: number | null; semestre: number | null; estado: string } | null>(null);

  contexto = computed(() => this.datos());

  ngOnInit(): void {
    if (!this.idEdicion) {
      this.cargando.set(false);
      this.error.set(true);
      return;
    }
    this.edicionService.getById(this.idEdicion).subscribe({
      next: ed => {
        const pv = ed.programa_version;
        this.datos.set({
          programa: pv?.programa?.nombre_programa ?? 'Programa',
          version: pv?.version ?? 0,
          edicion: ed.edicion,
          anio: ed.anio ?? null,
          semestre: ed.semestre ?? null,
          estado: ed.estado,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set(true);
      },
    });
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      programado: 'Programado',
      en_curso: 'En curso',
      reprogramado: 'Reprogramado',
      finalizado: 'Finalizado',
    };
    return map[estado] ?? estado;
  }
}