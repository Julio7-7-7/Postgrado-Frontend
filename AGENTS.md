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
9. **Contexto siempre actualizado** — después de cada cambio (bugfix, refactor, feature), se actualiza AGENTS.md con lo hecho, los archivos tocados y el estado del roadmap. Si hay cambios sin commit, se registran igual. Esto asegura que ante cualquier corte de energía o error se pueda retomar exactamente donde se dejó.

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
- Bug #34: Navbar admin tiene link "Alumnos" (`/alumnos`) que redirige al portal estudiante — no hay vista de gestión de alumnos para admin
- Posibles bugs de agenda/conflictos de horario docente
- Refinar contraste y diferenciación visual general
- Subida de documentos (requisitos) por parte del alumno + validación por admin (control_documentacion)

## Sesión 2026-07-09 — Implementación de Auth + RBAC + Admin panel

### Backend construido
- `dependencies.py`: `create_access_token()`, `get_current_user()`, `require_permiso(codigo)`
- `schemas/auth.py`: LoginRequest, RegisterRequest, TokenResponse, UserResponse, MeResponse
- `routers/auth.py`: POST /auth/login, POST /auth/register, GET /auth/me, GET /auth/roles
- `schemas/admin.py`: RolCreate/Update/Response, UserAdminResponse/Create/ChangeRol, PermisoResponse
- `routers/roles.py`: GET/POST/PUT/DELETE /roles/ (CRUD completo con permisos asignados)
- `routers/permisos.py`: GET /permisos/ (catálogo de 47 permisos)
- `routers/usuarios.py`: GET /usuarios/, POST, PUT /rol, PUT /activo
- `seed.py`: 7 roles, 47 permisos, 117 asignaciones, 3 cuentas admin
- `require_permiso` aplicado a los 17 routers existentes
- Fix: bcrypt downgraded 4.1.3→4.0.1 por incompatibilidad con passlib

### Frontend construido
- `core/services/auth.service.ts`: login, logout, token, userSignal, hasPermiso
- `core/interceptors/auth.interceptor.ts`: JWT injection + auto-logout en 401
- `core/guards/auth.guard.ts`: authGuard() + permisoGuard(codigo)
- `features/login/`: LoginComponent con selector de rol, email, password, spinner, errores
- `features/admin/`: AdminComponent (tabs), RolesList, RolForm (checkboxes agrupados), UsuariosList, UsuarioForm
- `navbar`: condicional @if(isLogged()), email+rol en menú, logout, navItems filtrados por permiso
- `routes`: login pública, todas las rutas protegidas con guards, /admin con permisoGuard

### Commits backend (5)
```
41d254b feat: add auth system (JWT dependencies, schemas, login/register/me/roles endpoints)
3c74eaf feat: add admin panel schemas and CRUD routers (roles, permisos, usuarios)
be5bc33 feat: seed database with roles, permissions, and admin user
a325479 feat: protect all backend routers with require_permiso dependency
6976367 fix: downgrade bcrypt to 4.0.1 for passlib compatibility
```

### Commits frontend (5)
```
cda6943 feat: add auth service, HTTP interceptor, route guards, and protect all routes
80cd104 feat: add login page with role selector
757cc97 feat: integrate auth into navbar (conditional render, user info, logout)
1790517 feat: add admin panel for roles and users management
c5953ec docs: update AGENTS.md with auth/RBAC session progress
```

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

**Fase 4 — Panel admin informático** ✅
19. ✅ Feature roles: listar, crear, editar con checkboxes de permisos
20. ✅ Feature usuarios: listar, crear, cambiar rol, activar/desactivar
21. ✅ Feature permisos: GET /permisos (catálogo para checkboxes)
22. ⬜ Matriz visual rol × permiso (opcional, postergable)

**Fase 5 — Portal estudiante** ✅
23. ✅ Registro e inscripción por auto-inscripción (POST /auto-inscribir)
24. ✅ Vista de perfil alumno con edición (GET/PATCH /mi-perfil)
25. ✅ Vista de inscripciones (GET /mis-inscripciones)
26. ✅ Oferta académica visible desde navbar del estudiante
27. ✅ Navbar condicional: admin ve menú completo, alumno solo Perfil/Inscripciones/Oferta
28. ✅ Rediseño login con paso de selección de rol (Administrativo/Estudiante/Docente)
29. ✅ Landing pública (/) con hero + carrusel + pilares
30. ✅ Public navbar con botón "Iniciar Sesión"

## Sesión 2026-07-09 — Fix navegación estudiante + Oferta en navbar
- Bug: ruta `/alumnos/oferta` no existía → tab roto
- Bug: alumno no tenía permiso `ediciones.ver` → error 403 al cargar oferta/inscribir
- Fix: agregada ruta `oferta` a `alumno.routes.ts`
- Fix: agregado `ediciones.ver` al rol alumno en `seed.py`
- Fix: `oferta.component.ts` usa `getActivas()` (endpoint público) en vez de `getAll(undefined, true)`
- Refactor: eliminados tabs del portal alumno (era redundante con navbar)
- Refactor: navbar de alumno ahora muestra: Mi Perfil, Mis Inscripciones, Oferta Académica

## Sesión 2026-07-09 — Fix bugs de navegación + permisos (v2)
### Bugs encontrados y arreglados:

1. **Race condition en `login.ts`**: `queryParams.subscribe` es asíncrono, `inscribirId` se leía después de que `getRoles()` ya había procesado la respuesta. Fix: usar `route.snapshot.queryParams` (síncrono).

2. **roleMap dinámico roto para admin**: El bucle `roleMap[r.nombre] = r.id_rol` creaba claves como `adm_informatico`, pero el UI busca `administrativo`. Fix: mapeo explícito `UI_KEY_TO_ROLE` que traduce clave visual → nombre de rol en BD.

3. **dashboardGuard dejaba pasar estudiantes**: Usaba `ediciones.ver` en su lista de permisos admin. Como el alumno ahora tiene `ediciones.ver`, el guard no lo bloqueaba. Fix: usar `profile_type === 'alumno'`.

4. **inscribir.ts navegaba away en error**: Si `getById` fallaba, llamaba a `router.navigate(['/alumnos'])` matando el componente. Fix: solo mostrar snackbar, no redirigir.

### Para que funcione:
- ✅ Backend: correr `python seed.py` para asignar `ediciones.ver` al rol alumno
- ✅ Frontend: login lee query params sincrónicamente, roleMap se construye con UI_KEY_TO_ROLE, dashboard guard usa profile_type

## Sesión 2026-07-09 — Seed modalidad, fix navegación + duplicados, cleanup

### Seed de modalidad académica
- Agregada `ModalidadAcademica` "Educación Continua" al seed con 3 requisitos: Fotocopia de Carnet, Boleta de GRL, Avance Académico de la UAGRM
- Fix: `get_or_create` no servía para usuarios por password_hash cambiante → creado `get_or_create_usuario()` que filtra solo por email+id_rol
- Fix: seed idempotente para modalidad/requisitos (busca por nombre único en vez de `get_or_create` genérico)

### Fix 1 — Inscribirme desde carrusel si está logueado
- `public-home.ts`: inyectado `AuthService`, `inscribirse()` ahora chequea `isLogged()` y navega directo a `/alumnos/inscribir/:id`

### Fix 2 — Botón atrás en formulario de inscripción
- `login.ts`: ambas redirecciones a `/alumnos/inscribir/:id` usan `{ replaceUrl: true }` para que login no quede en history y no haya loop al presionar atrás
- `inscribir.html`: botón "Cancelar" cambiado de `routerLink="/alumnos"` a `routerLink="/"` (vuelve al carrusel)

### Fix 3 — Validar duplicado de postulación
- `detalle_programa_alumno.py`: agregada validación que rechaza 400 si ya existe un `DetalleProgramaAlumno` con mismo `id_alumno` + `id_programa_version_edicion`

### Cleanup
- Eliminado componente `oferta` (tarjetas cuadradas) y su ruta en `alumno.routes.ts`
- Navbar: "Oferta Académica" de estudiantes apunta a `/` (carrusel público) con `exact: true`
- Pendiente: Bug #34 — link "Alumnos" en navbar admin redirige al portal estudiante, no hay gestión de alumnos para admin

### Archivos tocados
- `PostgradoBackend/seed.py` — modalidad + requisitos + fix get_or_create_usuario
- `PostgradoBackend/routers/detalle_programa_alumno.py` — validación duplicado
- `Postgrado-Frontend/src/app/features/public-home/pages/public-home.ts` — inscribirse directo si logueado
- `Postgrado-Frontend/src/app/features/login/pages/login.ts` — replaceUrl en redirecciones
- `Postgrado-Frontend/src/app/features/alumno/pages/inscribir/inscribir.html` — cancelar va a carrusel
- `Postgrado-Frontend/src/app/shared/components/navbar/navbar.ts` — oferta apunta a /
- `Postgrado-Frontend/src/app/features/alumno/routes/alumno.routes.ts` — ruta oferta eliminada
- `Postgrado-Frontend/src/app/features/alumno/pages/oferta/` — carpeta eliminada

## Sesión 2026-07-09 — Refactor panel admin (UI consistente + diálogos Material)

### Fix 1 — Route guard doble-lock
- `app.routes.ts`: cambiado `/admin` de `permisoGuard('roles.gestionar')` a `authGuard()`. El permiso fino se chequea en las rutas hijas. Esto permitía que usuarios con solo `usuarios.gestionar` (sin `roles.gestionar`) nunca accedieran a la pestaña Usuarios.

### Fix 2 — window.prompt() → Material dialog para cambiar rol
- Creado `admin-dialogs.ts` con `RolChangeDialog` (componente standalone con mat-select para elegir nuevo rol)
- `usuarios-list.ts`: `cambiarRol()` ahora abre `RolChangeDialog` en vez de llamar a `window.prompt()`

### Fix 3 — confirm() nativo → Material dialog
- Creado `ConfirmDialog` en `admin-dialogs.ts`
- `roles-list.ts`: `eliminarRol()` abre `ConfirmDialog` en vez de `confirm()` nativo
- `usuarios-list.ts`: `toggleActivo()` abre `ConfirmDialog` en vez de `confirm()` nativo

### Fix 4 — Diseño consistente (page-container + header-section + fich-table)
- `admin.ts`: ahora usa `.admin-wrapper { max-width: 1100px; margin: 0 auto; }` → `.page-container` → `header-section` con título + subtitle
- `roles-list.ts`: usa `fich-table`, `empty-state`, spinner en loading, colores con variables `--fich-*`
- `usuarios-list.html`: usa `fich-table`, `estado-pill` para rol y estado, `empty-state`
- `usuarios-list.css`: colores hardcodeados reemplazados por variables `--fich-*`

### Fix 5 — Rol-form mejoras
- Spinner Material en vez de texto "Cargando permisos..."
- Paneles colapsados por defecto ([expanded] quitado)
- Colores con variables CSS

### Archivos tocados
**Backend:**
- `routers/detalle_programa_alumno.py` — validación duplicado postulación

**Frontend:**
- `src/app/core/config/app.routes.ts` — guard de /admin cambiado a authGuard
- `src/app/features/admin/pages/admin.ts` — shell con page-container + admin-wrapper
- `src/app/features/admin/pages/roles-list.ts` — fich-table, ConfirmDialog, diseño consistente
- `src/app/features/admin/pages/rol-form.ts` — spinner, paneles colapsados, variables CSS
- `src/app/features/admin/pages/usuarios-list.ts` — RolChangeDialog, ConfirmDialog, imports limpios
- `src/app/features/admin/pages/usuarios-list.html` — fich-table, estado-pill, empty-state
- `src/app/features/admin/pages/usuarios-list.css` — variables CSS
- `src/app/features/admin/pages/admin-dialogs.ts` — archivo nuevo: ConfirmDialog + RolChangeDialog

### Pendientes
- Bug #34: Navbar admin link "Alumnos" redirige al portal estudiante — falta vista de gestión de alumnos para admin
- Edición de usuario (backend + frontend) — no hay endpoint PATCH para editar datos de usuario existente
- Matriz visual rol × permiso (opcional)
- Subida de documentos por alumno + validación por admin
