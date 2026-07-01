import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analog-clock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="clock-wrapper">
      <div class="clock-display" (click)="mode === 'minute' && backToHour()">
        <span class="clock-time">{{ hDisplay }}<span class="clock-blink">:</span>{{ mDisplay }}</span>
        <span class="clock-mode-hint">{{ mode === 'hour' ? 'Selecciona hora' : 'Selecciona minuto' }}</span>
      </div>

      <svg viewBox="0 0 320 320" class="clock-svg" (click)="onClockClick($event)">
        <circle cx="160" cy="160" r="140" fill="white" stroke="var(--fich-border)" stroke-width="1.5"/>

        @if (mode === 'hour') {
          @for (pos of [1,2,3,4,5,6,7,8,9,10,11,12]; track pos) {
            @let ang = (pos * 30 - 90) * Math.PI / 180;
            @let isSelected = selectedHour === hour24Value(pos);
            @let x = 160 + 117 * Math.cos(ang);
            @let y = 160 + 117 * Math.sin(ang);

            <text [attr.x]="x" [attr.y]="y"
              text-anchor="middle" dominant-baseline="central"
              class="clock-num"
              [class.selected]="isSelected"
              [class.clickable]="true">
              {{ clockLabel(pos) }}
            </text>
          }

          @if (selectedHour !== null) {
            <circle cx="160" cy="160" r="5" fill="var(--fich-primary)"/>
            @let selAng = (displayHour12 * 30 - 90) * Math.PI / 180;
            <line x1="160" y1="160"
              [attr.x2]="160 + 117 * Math.cos(selAng)"
              [attr.y2]="160 + 117 * Math.sin(selAng)"
              stroke="var(--fich-primary)" stroke-width="2.5" stroke-linecap="round"/>
            <circle
              [attr.cx]="160 + 117 * Math.cos(selAng)"
              [attr.cy]="160 + 117 * Math.sin(selAng)"
              r="6" fill="var(--fich-primary)"/>
          }
        }

        @if (mode === 'minute') {
          @for (m of minutos; track m) {
            @let ang = (m * 6 - 90) * Math.PI / 180;
            @let isSelected = selectedMinute === m;
            @let mx = 160 + 120 * Math.cos(ang);
            @let my = 160 + 120 * Math.sin(ang);

            <text [attr.x]="mx" [attr.y]="my"
              text-anchor="middle" dominant-baseline="central"
              class="clock-num clock-num-minute"
              [class.selected]="isSelected"
              [class.clickable]="true">
              {{ pad(m) }}
            </text>
          }

          <circle cx="160" cy="160" r="5" fill="var(--fich-primary)"/>
          @let minAng = (selectedMinute * 6 - 90) * Math.PI / 180;
          <line x1="160" y1="160"
            [attr.x2]="160 + 120 * Math.cos(minAng)"
            [attr.y2]="160 + 120 * Math.sin(minAng)"
            stroke="var(--fich-primary)" stroke-width="2.5" stroke-linecap="round"/>
          <circle
            [attr.cx]="160 + 120 * Math.cos(minAng)"
            [attr.cy]="160 + 120 * Math.sin(minAng)"
            r="6" fill="var(--fich-primary)"/>
        }

        <circle cx="160" cy="160" r="140" fill="transparent" class="click-capture"/>
      </svg>

      @if (mode === 'hour') {
        <div class="period-toggle">
          <button [class.active]="period === 'AM'" (click)="setPeriod('AM')">AM</button>
          <button [class.active]="period === 'PM'" (click)="setPeriod('PM')">PM</button>
        </div>
      }
      @if (mode === 'minute') {
        <button class="back-btn" (click)="backToHour()">
          <span class="back-arrow">&#8592;</span> Hora
        </button>
      }
    </div>
  `,
  styles: [`
    .clock-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }
    .clock-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: default;
      user-select: none;
    }
    .clock-time {
      font-size: 2rem;
      font-weight: 700;
      font-family: 'Inter', 'Roboto Mono', monospace;
      color: var(--fich-primary-dark);
      letter-spacing: 0.08em;
    }
    .clock-blink {
      animation: blink 1s step-end infinite;
    }
    @keyframes blink {
      50% { opacity: 0; }
    }
    .clock-mode-hint {
      font-size: 0.7rem;
      color: var(--fich-text-muted);
      opacity: 0.7;
      margin-top: 1px;
    }
    .clock-svg {
      width: 100%;
      max-width: 220px;
      height: auto;
      aspect-ratio: 1;
      cursor: pointer;
    }
    .clock-num {
      font-size: 14px;
      font-weight: 600;
      fill: var(--fich-text);
      transition: fill 0.15s, font-size 0.15s;
      dominant-baseline: central;
      text-anchor: middle;
    }
    .clock-num.clickable { cursor: pointer; }
    .clock-num.clickable:hover {
      fill: var(--fich-primary);
      font-size: 16px;
    }
    .clock-num.selected {
      fill: white;
      font-size: 15px;
      font-weight: 700;
    }
    .clock-num-minute {
      font-size: 12px;
      font-family: 'Roboto Mono', monospace;
    }
    .clock-num-minute.selected {
      fill: white;
      font-size: 13px;
    }
    .click-capture { cursor: pointer; }
    .period-toggle {
      display: flex;
      border-radius: 999px;
      overflow: hidden;
      border: 1.5px solid var(--fich-border);
    }
    .period-toggle button {
      padding: 4px 20px;
      border: none;
      background: transparent;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--fich-text-secondary);
      transition: background 0.2s, color 0.2s;
    }
    .period-toggle button.active {
      background: var(--fich-primary);
      color: white;
    }
    .period-toggle button:not(.active):hover {
      background: var(--fich-bg-hover);
    }
    .back-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 14px;
      border: 1.5px solid var(--fich-border);
      border-radius: 999px;
      background: transparent;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--fich-text-secondary);
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    }
    .back-btn:hover {
      background: var(--fich-bg-hover);
      border-color: var(--fich-primary);
      color: var(--fich-primary);
    }
    .back-arrow { font-size: 1rem; line-height: 1; }
  `]
})
export class AnalogClockComponent implements OnInit {
  @Input() value: string = '00:00';
  @Output() valueChange = new EventEmitter<string>();

  Math = Math;

  selectedHour: number | null = null;
  selectedMinute = 0;
  mode: 'hour' | 'minute' = 'hour';
  period: 'AM' | 'PM' = 'AM';

  readonly minutos = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  ngOnInit() {
    const [h, m] = this.value.split(':').map(Number);
    if (!isNaN(h)) {
      this.selectedHour = h;
      this.period = h >= 12 ? 'PM' : 'AM';
    }
    if (!isNaN(m)) this.selectedMinute = m;
  }

  get displayHour12(): number {
    if (this.selectedHour === null) return -1;
    const h = this.selectedHour % 12;
    return h === 0 ? 12 : h;
  }

  get hDisplay(): string {
    return this.selectedHour !== null ? String(this.selectedHour).padStart(2, '0') : '--';
  }

  get mDisplay(): string {
    return String(this.selectedMinute).padStart(2, '0');
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  clockLabel(pos: number): string {
    if (this.period === 'PM') {
      return String(pos === 12 ? 12 : pos + 12);
    }
    return String(pos);
  }

  hour24Value(pos: number): number {
    if (this.period === 'PM') {
      return pos === 12 ? 12 : pos + 12;
    }
    return pos === 12 ? 0 : pos;
  }

  setPeriod(p: 'AM' | 'PM') {
    if (p === this.period) return;
    if (this.selectedHour !== null) {
      if (p === 'PM' && this.selectedHour < 12) {
        this.selectedHour += 12;
      } else if (p === 'AM' && this.selectedHour >= 12) {
        this.selectedHour -= 12;
      }
      this.emitValue();
    }
    this.period = p;
  }

  onClockClick(event: MouseEvent) {
    const svg = (event.target as SVGElement).closest('svg') as SVGSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const scaleX = 320 / rect.width;
    const scaleY = 320 / rect.height;

    const svgX = (event.clientX - rect.left) * scaleX;
    const svgY = (event.clientY - rect.top) * scaleY;

    const relX = svgX - 160;
    const relY = svgY - 160;
    const dist = Math.sqrt(relX * relX + relY * relY);

    if (dist > 145) return;

    let deg = (Math.atan2(relY, relX) * 180 / Math.PI) + 90;
    if (deg < 0) deg += 360;

    if (this.mode === 'hour') {
      let h = Math.round(deg / 30) % 12;
      if (h === 0) h = 12;

      if (dist < 90) return;

      if (this.period === 'PM') {
        this.selectedHour = h === 12 ? 12 : h + 12;
      } else {
        this.selectedHour = h === 12 ? 0 : h;
      }

      this.selectedMinute = 0;
      this.emitValue();
      this.mode = 'minute';
    } else {
      const m = Math.round(deg / 6) % 60;
      this.selectedMinute = m;
      this.emitValue();
    }
  }

  backToHour() {
    this.mode = 'hour';
  }

  private emitValue() {
    if (this.selectedHour === null) return;
    const h = String(this.selectedHour).padStart(2, '0');
    const m = String(this.selectedMinute).padStart(2, '0');
    this.valueChange.emit(`${h}:${m}`);
  }
}
