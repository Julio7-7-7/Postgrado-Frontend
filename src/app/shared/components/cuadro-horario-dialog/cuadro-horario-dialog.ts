import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Horario } from '../../../features/horario/models/horario.model';

export interface CalendarDay {
  date: Date | null;
  dayNumber: number;
  isInRange: boolean;
  hasClass: boolean;
  horarios: Horario[];
  isPadding: boolean;
  isToday: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;
  monthName: string;
  weeks: CalendarDay[][];
}

export interface CuadroHorarioData {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  horarios: Horario[];
  moduloNombre: string;
  moduloSigla: string;
}

@Component({
  selector: 'app-cuadro-horario',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule,
  ],
  templateUrl: './cuadro-horario-dialog.html',
  styleUrl: './cuadro-horario-dialog.css',
})
export class CuadroHorarioDialogComponent {
  months: CalendarMonth[] = [];
  diaLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  private readonly DIA_MAP: Record<string, number> = {
    lunes: 1, martes: 2, miercoles: 3, jueves: 4,
    viernes: 5, sabado: 6, domingo: 0,
  };

  private readonly DIAS_FULL: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
  };

  get patronTexto(): string {
    const hs = this.data.horarios.filter(h => h.estado === 'activo');
    if (hs.length === 0) return '';
    const unicos = new Map<string, Horario[]>();
    for (const h of hs) {
      const key = `${h.hora_ini}-${h.hora_fin}`;
      if (!unicos.has(key)) unicos.set(key, []);
      unicos.get(key)!.push(h);
    }
    return Array.from(unicos.entries()).map(([_, grupo]) => {
      const dias = grupo.map(h => this.DIAS_FULL[h.dia] || h.dia);
      const orden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      dias.sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
      return `${dias.join(' · ')} · ${grupo[0].hora_ini}–${grupo[0].hora_fin}`;
    }).join('\n');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CuadroHorarioData,
  ) {
    this.generarCalendario();
  }

  private generarCalendario() {
    if (!this.data.fecha_inicio || !this.data.fecha_fin) return;

    const start = new Date(this.data.fecha_inicio + 'T00:00:00');
    const end = new Date(this.data.fecha_fin + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diasClase = new Set<number>();
    const horariosPorDia = new Map<number, Horario[]>();

    for (const h of this.data.horarios) {
      if (h.estado === 'cancelado') continue;
      const jsDay = this.DIA_MAP[h.dia];
      diasClase.add(jsDay);
      if (!horariosPorDia.has(jsDay)) horariosPorDia.set(jsDay, []);
      horariosPorDia.get(jsDay)!.push(h);
    }

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      this.months.push(this.generarMes(current, start, end, diasClase, horariosPorDia, today));
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
  }

  private generarMes(
    month: Date, start: Date, end: Date,
    diasClase: Set<number>,
    horariosPorDia: Map<number, Horario[]>,
    today: Date,
  ): CalendarMonth {
    const year = month.getFullYear();
    const mon = month.getMonth();
    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    const firstDay = new Date(year, mon, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    const weeks: CalendarDay[][] = [];
    let week: CalendarDay[] = [];

    for (let i = 0; i < startOffset; i++) {
      week.push({ date: null, dayNumber: 0, isInRange: false, hasClass: false, horarios: [], isPadding: true, isToday: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, mon, d);
      const jsDay = date.getDay();
      const gridCol = jsDay === 0 ? 6 : jsDay - 1;
      const isInRange = date >= start && date <= end;
      const hasClass = isInRange && diasClase.has(jsDay);
      const horariosDelDia = hasClass ? (horariosPorDia.get(jsDay) || []) : [];

      week.push({
        date, dayNumber: d, isInRange, hasClass,
        horarios: horariosDelDia, isPadding: false,
        isToday: date.getTime() === today.getTime(),
      });

      if (gridCol === 6) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ date: null, dayNumber: 0, isInRange: false, hasClass: false, horarios: [], isPadding: true, isToday: false });
      }
      weeks.push(week);
    }

    return { year, month: mon, monthName: monthNames[mon], weeks };
  }

  diaFull(dia: string): string {
    return this.DIAS_FULL[dia] || dia;
  }

  tooltipTexto(day: CalendarDay): string {
    if (!day.hasClass) return '';
    return day.horarios.map(h =>
      `${this.diaFull(h.dia)} ${h.hora_ini}–${h.hora_fin}${h.aula ? ' · ' + h.aula : ''}`
    ).join('\n');
  }
}
