import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent], // Importamos el componente del Navbar aquí
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = signal('Postgrado-Frontend');
}