import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/core/config/app.config';
import { AppComponent } from './app/layout/app'; 

// Este archivo arranca la aplicación usando la configuración y el componente principal
// ahora que los movimos a sus nuevas carpetas.
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));