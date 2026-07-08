## Contexto del proyecto

Stack: Angular 19 (standalone, Material M3, Signals + RxJS) + FastAPI + SQLAlchemy + PostgreSQL
BD: postgresql local (ver .env en backend)
Backend: github.com/Julio7-7-7/PostgradoBackend

## Guías de diseño
- `DESIGN.md` — identidad visual: azul FICH (#1e3a8a), sin glassmorphism, sin bordered-left, sombras parcas, croma mínimo
- `PRODUCT.md` — institucional moderno, anti-template genérico, animaciones con propósito (<300ms), estados vacío/loading/error obligatorios

## Módulos del frontend

### detalle-programa-modulo
- `detalle-list` — carrusel (abanico) de módulos con tarjetas, horarios inline, botones Historial / Ver Cuadro Horario / Gestionar
- `detalle-gestionar` — edición de módulo: estado, fechas, horarios (CRUD con pendingActions), historial
- `detalle-form` — crear/editar detalle

### horario-dialog (features/horario/components)
- Diálogo con chips multi-select de días + reloj analógico
- Creación multi-día, edición con día fijo

### cuadro-horario-dialog (shared/components)
- Calendario mensual estilo Google Calendar, toolbar con rango de fechas y patrón de repetición
- Solo desde `detalle-list`, no desde `detalle-gestionar`

### date-utils (core/utils)
- `aDate(iso)` — parsea fechas ISO a Date local sin timezone bug

### home (dashboard)
- Header con fecha + acciones rápidas
- Stats row clickeables (Programas, Docentes, Tipos, Alumnos)
- Carrusel "Oferta Académica" con fotos + banners de color por estado
- Sección "Acceso Directo" con 4 módulos

## Feature colors system
- `--fich-feature-programa: #1e3a8a` / `-light: #eef2ff`
- `--fich-feature-tipo-programa: #7c3aed` / `-light: #f5f3ff`
- `--fich-feature-docente: #0d9488` / `-light: #f0fdfa`
- `--fich-feature-contratacion: #d97706` / `-light: #fffbeb`
- `--fich-feature-alumno: #0891b2` / `-light: #ecfeff`
- `--fich-feature-edicion: #4f46e5` / `-light: #eef2ff`
- `--fich-feature-modulo: #0d9488` / `-light: #f0fdfa`

## Bugs corregidos
1. **Timezone date shift** — `new Date("2026-07-01")` en UTC daba día anterior en UTC-4. Fix: `aDate()` helper.
2. **Pending deletes en cancel** — `volverAlCarrusel()` no limpiaba `pendingActions`. Fix: `pendingActions.set([])`.
3. **Horarios cancelados visibles en carrusel** — `horariosDe()` filtra `h.estado === 'activo'`.
4. **Calendario con datos stale** — `verCuadroHorario()` ahora fetch fresh.
5. **Patrón de repetición mostraba cancelados** — `patronTexto` filtra `estado === 'activo'`.
6. **Multi-día en horario-dialog** — chips toggle, `guardar()` devuelve `HorarioCreate[]`.

## Tareas completadas (sesión 2026-07-08)

### Visuales
- Eliminado glassmorphism del navbar (`backdrop-filter: blur`)
- Reducido navbar de 68px → 64px
- Eliminados bordes decorativos superiores (::before gradient 3px) de stat-cards
- Aquecido fondo global: `#f1f5f9` → `#f4f6f9` + radial-gradient sutíl al body
- Eliminado duplicado `.mat-mdc-tooltip` en styles.css
- Footer: "Chaco" → "Facultad de Ingeniería — Chaco"

### Feature colors + navbar
- Fix label "Nombre del Programa" → "Nombre del Tipo de Programa" en tipo-programa-form
- Sistema de colores por feature en material-theme.scss + styles.css
- Feature classes (`.feature-*`) aplicadas a todas las páginas
- Navbar: iconos coloreados por feature, active state usa color de feature

### Rediseños
- Tarjetas de módulos (detalle-list): gradient header, info rows con hover, horarios pulidos, botón gestionar con glow
- Dashboard home: sin hero, stats clickeables, carrusel protagonista con fotos, acceso directo compacto

## Open Design (herramienta de diseño AI)
- Instalado en `~/Programación/open-design/` (v0.14.1, git clone + pnpm install)
- Daemon: `node apps/daemon/bin/od.mjs --port <puerto> --no-open`
- Daemon no funciona con `pnpm tools-dev` (error: "desktop did not expose status in time")
- Se usa vía CLI directa

## Archivos relevantes
- `~/Programación/Postgrado-Frontend/` — proyecto Angular
- `~/Programación/Postgrado-Frontend/src/material-theme.scss` — tema Material + variables
- `~/Programación/Postgrado-Frontend/src/styles.css` — estilos globales + feature colors

## Pendientes
- Bug #34: Ruta `/alumnos` existe en navbar pero backend no la implementa
- Posibles bugs de agenda/conflictos de horario docente
- Refinar contraste y diferenciación visual general
