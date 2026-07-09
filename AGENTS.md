## Perfil del agente

Eres un **mentor crítico y compañero de código**. Tu rol no es ejecutar órdenes sin cuestionar, sino discutir, proponer, advertir y decidir junto al usuario. Reglas:

1. **Nada se toca sin discusión previa** — antes de escribir código, hay que entender el problema, analizar opciones, evaluar pros/contra y acordar la solución.
2. **No sos complaciente** — si ves un error, una mala práctica, un atajo peligroso o una perspectiva que el usuario no está considerando, lo decís. No importa si el usuario insiste, vos exponés tu postura profesional.
3. **Tampoco sos un bloqueador** — no se trata de rechazar todo, sino de construir juntos la mejor solución. Si después de discutir se decide algo que no te parece óptimo, lo aceptás y dejás constancia en AGENTS.md.
4. **Al empezar cada sesión**, preguntá qué trae el usuario (feature, bug, duda, exploración). No asumas el contexto.
5. **Si algo es grande o ambicioso**, proponé dimensionarlo: primero superficie, luego profundidad. Por defecto vas a querer cubrir todo — el usuario te frena si necesita menos.
6. **Los cambios de opinión son bienvenidos** — no hay código sagrado. Si se decide cambiar algo ya hecho, se cambia y ya.
7. **Trabajo por capas** — cada feature se construye en este orden: (1) modelo de datos → campos + relaciones, (2) backend → rutas, schemas, validaciones, (3) frontend → componentes, servicios, UI/UX. No se salta una capa sin discutir antes.
8. **Cero código sin orden explícita** — no se escribe ni una línea hasta que el usuario diga "vamos", "a darle" o equivalente. Mientras tanto solo se discute, analiza, diagrama y planifica.

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

### Oferta académica (backend + frontend)
- CRUD completo de: programas, tipos de programa, versiones, ediciones, módulos, horarios, docentes, contrataciones
- Reglas de contratación docente: un módulo a la vez, máximo 2 por edición, validación por fechas del módulo
- Rediseño visual completo del frontend: dashboard, tarjetas de módulos, navbar coloreada, lista de ediciones
- Sistema de colores por feature (navbar solo), primary color índigo #4338ca

### Gestión de alumnos — backend model-listo
- `alumnos` — tabla con campos básicos + estado
- `modalidades_academicas` — con uso_unico para educación continua
- `requisitos` — vinculados a modalidad académica
- `tipos_descuento` — con requiere_documento + id_requisito_extra
- `control_documentacion` — control de entrega/revisión por requisito
- `detalle_programa_alumno` — postulación con generación automática de controles, uso_unico, aplicación de descuento
- Flujo postulante→inscrito automático cuando todos los obligatorios están aceptados

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

## Sesión 2026-07-09 — Diseño de Auth + RBAC + Administrativos

### Resumen de decisiones

**Login:** selección de rol (Administrativo | Docente | Alumno) → email + password → JWT

**RBAC con tabla roles gestionable desde panel:**
- `roles` tabla (con CRUD para admin informático)
- `permisos` tabla (catálogo de acciones: `programas.crear`, `pagos.registrar`, etc.)
- `roles_permisos` (PK compuesta) — asigna permisos a roles
- `usuarios.id_rol` FK → `roles` — cambiar el rol cambia permisos automáticamente

**Administrativos:** una sola tabla, NO una por cargo
- `administrativos` (ci, nombre, apellido, cargo, correo, celular, id_usuario FK)
- `cargo` es campo informativo (organigrama carnet), no define permisos
- La diferencia real entre legal/contable/director/pasante está en los permisos vía rol

**Nuevas tablas:**
- `roles`, `permisos`, `roles_permisos`, `usuarios`, `administrativos`

**Modificar:**
- `alumnos` + `docentes`: agregar `id_usuario` FK nullable, quitar unique de `correo`
- Unique en `usuarios`: `(email, id_rol)` — misma persona puede tener dos cuentas con mismo email y distinto rol

**Frontend:** validación de permisos también (route guards + menú dinámico). No confiar solo en backend.

**Seed inicial roles:** adm_informatico, adm_legal, adm_contable, adm_director, adm_pasante, docente, alumno

### Dudas resueltas
- Login con **correo+contraseña** (no CI/pasaporte)
- Admin que también es estudiante → **misma cuenta con rol extra** (o sea dos registros en `usuarios`: mismo email, distinto `id_rol`)
- Soft delete **queda pendiente de definir cuándo se implementa**

### Roadmap completo — Auth + RBAC + Alumnos

**Fase 1 — Modelo de datos (backend)** ✅
1. ✅ Migración: `roles`, `permisos`, `roles_permisos`
2. ✅ Migración: `usuarios` con unique(email, id_rol)
3. ✅ Migración: `administrativos`
4. ✅ Migración: `id_usuario` a `alumnos` y `docentes`, quitar unique de `correo`
5. ✅ Seed: roles
6. ✅ Seed: permisos base (47 permisos)
7. ✅ Seed: asignar permisos a cada rol
8. ✅ Seed: usuario `julio.toledo2030@gmail.com` (adm_informatico, docente, alumno)

**Fase 2 — Auth backend** ✅
9. ✅ Modelos + schemas de auth
10. ✅ `POST /auth/register` — crea usuario + perfil según rol
11. ✅ `POST /auth/login` — JWT con claims (id_usuario, id_rol, id_profile, email, permisos[])
12. ✅ `GET /auth/me` — perfil del usuario logueado
13. ✅ Dependencias: `get_current_user()` + `require_permiso(codigo)`

**Backend — Permisos en routers** ✅
- ✅ `require_permiso` aplicado a los 17 routers del sistema
- ✅ Sin token → 401, sin permiso → 403, con permiso → 200

**Fase 3 — Frontend auth** ✅
14. ✅ Página de login con selector de rol, email, password
15. ✅ AuthService (login, logout, token, userSignal, hasPermiso)
16. ✅ HTTP interceptor (adjunta JWT, logout automático en 401)
17. ✅ Route guards por permisos (authGuard + permisoGuard)
18. ✅ Navbar dinámico según permisos del usuario

**Fase 4 — Panel admin informático** ⬜
19. Feature roles: listar, crear, editar con checkboxes de permisos
20. Feature usuarios: listar, crear, cambiar rol, activar/desactivar
21. Feature permisos: matriz rol x permiso (opcional)

**Fase 5 — Portal estudiante** ⬜
22. Registro público de alumno
23. Vista de perfil, documentación, pagos, notas
24. Subida de documentos para postulación

### Pendientes
- Bug #34: Ruta `/alumnos` existe en navbar pero backend no la implementa
- Posibles bugs de agenda/conflictos de horario docente
- Refinar contraste y diferenciación visual general
- Soft delete en tablas de alumnos: definir cuándo se hace
- La navbar no se oculta en la página de login (el template chequea isLogged())
