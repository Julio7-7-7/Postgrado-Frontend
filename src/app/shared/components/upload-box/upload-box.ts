import { Component, EventEmitter, Input, Output, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-upload-box',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './upload-box.html',
  styleUrl: './upload-box.css',
})
export class UploadBoxComponent {
  @Input() accept = '*/*';
  @Input() disabled = false;
  @Input() file: File | null = null;
  @Input() fileName = '';
  @Input() fileSize = '';
  @Input() label = 'Seleccionar o arrastrar el archivo';
  @Input() hint = '';
  @Input() confirmText = 'Subir';
  @Input() showConfirmButtons = true;
  @Input() uploading = false;
  @Input() uploadDone = false;
  @Input() uploadLabel = 'Subiendo...';

  @Output() picked = new EventEmitter<File>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  dragOver = signal(false);

  private inputRef = viewChild('inputFile', { read: ElementRef<HTMLInputElement> });

  protected get esPdf(): boolean {
    return this.file?.type === 'application/pdf' || /\.pdf$/i.test(this.file?.name ?? '');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled && !this.uploading) this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    if (this.disabled || this.uploading) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.picked.emit(file);
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.picked.emit(file);
  }

  abrir(): void {
    if (this.disabled || this.uploading) return;
    this.inputRef()?.nativeElement.click();
  }

  limpiarDrag(): void {
    this.dragOver.set(false);
  }
}
