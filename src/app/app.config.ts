import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Este archivo le dice a Angular qué herramientas externas usar (Rutas, API, Animaciones)
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // Configura las rutas definidas en app.routes.ts
    provideHttpClient(),   // Permite que la app haga peticiones a tu FastAPI
    provideAnimationsAsync() // Habilita animaciones para Angular Material
  ]
};