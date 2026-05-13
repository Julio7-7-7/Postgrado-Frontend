import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; 

// UBICACIÓN: src/main.ts (está afuera de la carpeta app)
// Este es el primer código que se ejecuta. Llama al componente y a la configuración.
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));