import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// UBICACIÓN: src/app/app.ts
@Component({
  selector: 'app-root', 
  standalone: true,     
  imports: [RouterOutlet], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  // Cambiamos la variable normal por un Signal de Angular 19
  title = signal('Postgrado-Frontend');
}