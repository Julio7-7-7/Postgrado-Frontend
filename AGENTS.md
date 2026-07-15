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
- Módulo pagos: modelo, endpoints y front
- Módulo notas: modelo, endpoints y front
- Endpoint dashboard: estadísticas del admin
- Filtrado de alumnos por período: endpoint `GET /alumnos/por-periodo/{id_periodo}`
- Matriz visual rol × permiso (opcional)
- Acoplamiento de estudiantes entre ediciones: campo `modulo_inicio` en `DetalleProgramaAlumno`

## Sesión 2026-07-10 — Implementación de Auth + RBAC + Admin panel (pre-migración)

### Backend construido (pre-migración)
- `dependencies.py`: `create_access_token()`, `get_current_user()`, `require_permiso(codigo)`, `_obtener_roles_usuario()`
- `schemas/auth.py`: LoginRequest, SelectRolRequest, LoginStep1Response, RolInfo, UserResponse, MeResponse
- `routers/auth.py`: POST /auth/login (2 pasos), POST /auth/seleccionar-rol, GET /auth/me, GET /auth/roles
- `schemas/admin.py`: RolCreate/Update/Response, UserAdminResponse/Create/UpdateRoles, PermisoResponse
- `routers/roles.py`: GET/POST/PUT/DELETE /roles/ (CRUD completo con permisos asignados)
- `routers/permisos.py`: GET /permisos/ (catálogo de 47 permisos)
- `routers/usuarios.py`: GET /usuarios/, POST, PUT /roles, PUT /activo
- `seed.py`: 7 roles, 47 permisos, 117 asignaciones, 3 cuentas admin
- `require_permiso` aplicado a los 17 routers existentes
- Fix: bcrypt downgraded 4.1.3→4.0.1 por incompatibilidad con passlib

### Frontend construido (pre-migración)
- `core/services/auth.service.ts`: login (2 pasos), logout, token, userSignal, hasPermiso, seleccionarRol
- `core/interceptors/auth.interceptor.ts`: JWT injection + auto-logout en 401
- `core/guards/auth.guard.ts`: authGuard() + permisoGuard(codigo)
- `features/login/`: LoginComponent con 2 pasos (credentials → selección de rol), auto-selección alumno
- `features/admin/`: AdminComponent (tabs), RolesList, RolForm (checkboxes agrupados), UsuariosList (columna roles), UsuarioForm (checkboxes roles), RolesChangeDialog
- `navbar`: condicional @if(isLogged()), email+rol en menú, logout, navItems filtrados por permiso
- `routes`: login pública, todas las rutas protegidas con guards, /admin con authGuard

### Commits backend (5) (pre-migración)
```
41d254b feat: add auth system (JWT dependencies, schemas, login/register/me/roles endpoints)
3c74eaf feat: add admin panel schemas and CRUD routers (roles, permisos, usuarios)
be5bc33 feat: seed database with roles, permissions, and admin user
a325479 feat: protect all backend routers with require_permiso dependency
6976367 fix: downgrade bcrypt to 4.0.1 for passlib compatibility
```

### Commits frontend (5) (pre-migración)
```
cda6943 feat: add auth service, HTTP interceptor, route guards, and protect all routes
80cd104 feat: add login page with role selector
757cc97 feat: integrate auth into navbar (conditional render, user info, logout)
1790517 feat: add admin panel for roles and users management
c5953ec docs: update AGENTS.md with auth/RBAC session progress
```

## Sesión 2026-07-10 — Diseño de Auth + RBAC + Administrativos (pre-migración)

### Resumen de decisiones (original — 1 usuario = 1 rol)

**Login:** 2 pasos — email+password → selección de rol → JWT

**RBAC con tabla roles gestionable desde panel:**
- `roles` tabla (con CRUD para admin informático)
- `permisos` tabla (catálogo de acciones: `programas.crear`, `pagos.registrar`, etc.)
- `roles_permisos` (PK compuesta) — asigna permisos a roles
- `usuario_roles` (PK compuesta: id_usuario + id_rol, rol_activo) — un usuario puede tener múltiples roles

**Administrativos:** una sola tabla, NO una por cargo
- `administrativos` (ci, nombre, apellido, cargo, correo, celular, id_usuario FK)
- `cargo` es campo informativo (organigrama carnet), no define permisos
- La diferencia real entre legal/contable/director/pasante está en los permisos vía rol

**Nuevas tablas:**
- `roles`, `permisos`, `roles_permisos`, `usuarios`, `usuario_roles`, `administrativos`

**Modificar:**
- `alumnos` + `docentes`: agregar `id_usuario` FK nullable, quitar unique de `correo`
- Unique en `usuarios`: `email` (un solo usuario por email)

**Frontend:** validación de permisos también (route guards + menú dinámico). No confiar solo en backend.

**Seed inicial roles:** adm_informatico, adm_legal, adm_contable, adm_director, adm_pasante, docente, alumno

### Dudas resueltas
- Login con **correo+contraseña** (no CI/pasaporte)
- Admin que también es estudiante → **misma cuenta con múltiples roles** (tabla `usuario_roles`)
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
10. ✅ Login en 2 pasos — email+password → selección de rol → JWT
11. ✅ JWT con claims (id_usuario, id_rol, id_profile, email, permisos[])
12. ✅ `GET /auth/me` — perfil del usuario logueado
13. ✅ Dependencias: `get_current_user()` + `require_permiso(codigo)`
14. ✅ Tabla intermedia `usuario_roles` para múltiples roles por usuario

**Backend — Permisos en routers** ✅
- ✅ `require_permiso` aplicado a los 17 routers del sistema
- ✅ Sin token → 401, sin permiso → 403, con permiso → 200

**Fase 3 — Frontend auth** ✅
14. ✅ Página de login con 2 pasos (credentials → selección de rol)
15. ✅ AuthService (login 2 pasos, logout, token, userSignal, hasPermiso, seleccionarRol)
16. ✅ HTTP interceptor (adjunta JWT, logout automático en 401)
17. ✅ Route guards por permisos (authGuard + permisoGuard)
18. ✅ Navbar dinámico según permisos del usuario
19. ✅ Redirección por rol: admin→/dashboard, alumno→/ (oferta)

**Fase 4 — Panel admin informático** ✅
19. ✅ Feature roles: listar, crear, editar con checkboxes de permisos
20. ✅ Feature usuarios: listar, crear, asignar múltiples roles, activar/desactivar
21. ✅ Feature permisos: GET /permisos (catálogo para checkboxes)
22. ✅ Diálogos Material: ConfirmDialog, RolChangeDialog, RolesChangeDialog
23. ⬜ Matriz visual rol × permiso (opcional, postergable)

**Fase 5 — Portal estudiante** ✅
24. ✅ Registro e inscripción por auto-inscripción (POST /auto-inscribir)
25. ✅ Vista de perfil alumno con edición (GET/PATCH /mi-perfil)
26. ✅ Vista de inscripciones (GET /mis-inscripciones)
27. ✅ Oferta académica visible desde navbar del estudiante
28. ✅ Navbar condicional: admin ve menú completo, alumno solo Perfil/Inscripciones/Oferta
29. ✅ Landing pública (/) con hero + carrusel + pilares
30. ✅ Public navbar con botón "Iniciar Sesión"
31. ✅ Login 2 pasos: credenciales → selección de rol → redirección por rol
32. ✅ Auto-selección de rol "alumno" al inscribirse desde landing

## Sesión 2026-07-10 — Fix navegación estudiante + Oferta en navbar (pre-migración)
- Bug: ruta `/alumnos/oferta` no existía → tab roto (pre-migración)
- Bug: alumno no tenía permiso `ediciones.ver` → error 403 al cargar oferta/inscribir (pre-migración)
- Fix: agregada ruta `oferta` a `alumno.routes.ts` (pre-migración)
- Fix: agregado `ediciones.ver` al rol alumno en `seed.py` (pre-migración)
- Fix: `oferta.component.ts` usa `getActivas()` (endpoint público) en vez de `getAll(undefined, true)` (pre-migración)
- Refactor: eliminados tabs del portal alumno (era redundante con navbar) (pre-migración)
- Refactor: navbar de alumno ahora muestra: Mi Perfil, Mis Inscripciones, Oferta Académica
## Sesión 2026-07-10 — Fix bugs de navegación + permisos (v2) (pre-migración)

### Bugs encontrados y arreglados (pre-migración):

1. **Race condition en `login.ts`**: `queryParams.subscribe` es asíncrono, `inscribirId` se leía después de que `getRoles()` ya había procesado la respuesta. Fix: usar `route.snapshot.queryParams` (síncrono).

2. **roleMap dinámico roto para admin**: El bucle `roleMap[r.nombre] = r.id_rol` creaba claves como `adm_informatico`, pero el UI busca `administrativo`. Fix: mapeo explícito `UI_KEY_TO_ROLE` que traduce clave visual → nombre de rol en BD.

3. **dashboardGuard dejaba pasar estudiantes**: Usaba `ediciones.ver` en su lista de permisos admin. Como el alumno ahora tiene `ediciones.ver`, el guard no lo bloqueaba. Fix: usar `profile_type === 'alumno'`.

4. **inscribir.ts navegaba away en error**: Si `getById` fallaba, llamaba a `router.navigate(['/alumnos'])` matando el componente. Fix: solo mostrar snackbar, no redirigir.

### Para que funcione:
- ✅ Backend: correr `python seed.py` para asignar `ediciones.ver` al rol alumno
- ✅ Frontend: login lee query params sincrónicamente, roleMap se construye con UI_KEY_TO_ROLE, dashboard guard usa profile_type

## Sesión 2026-07-10 — Seed modalidad, fix navegación + duplicados, cleanup (pre-migración)

### Seed de modalidad académica (pre-migración)
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

## Sesión 2026-07-10 — Refactor panel admin (UI consistente + diálogos Material) (pre-migración)

### Fix 1 — Route guard doble-lock (pre-migración)
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
- **Perfeccionar rol adm_informatico**: el usuario quiere que sea su perfil de testing universal (admin + docente + alumno sin cambiar de cuenta). Se analizó que `_obtener_profile_info` en `dependencies.py:84` busca en orden alumno → docente → administrativo, pero como el seed crea 3 usuarios distintos con el mismo email (cada uno con distinto `id_usuario`), el usuario admin no tiene `alumno` asociado via FK. Solución propuesta: modificar `_obtener_profile_info` para que para `adm_informatico` busque también alumno por email. Pendiente de implementar.

## Sesión 2026-07-10 — Análisis de permisos + ER diagram (pre-migración)

### Diagnóstico
- **Navbar docentes no cargaba**: no hay bugs en el código. Análisis completo de la cadena navbar → routes → guards → componente → service → backend no encontró inconsistencias. Causa más probable: **token JWT desactualizado** (emitido antes de agregar ciertos permisos al rol). Fix: cerrar sesión y volver a loguearse, o correr `python seed.py` y重新 loguear.
- **adm_informatico ya tiene los 47 permisos** del sistema (todos los de la lista `permisos` en `seed.py:43-69`). El navbar filtra por permisos, así que debería mostrar todo. Si algo no carga, es tema de token stale.

### Diagrama ER — Auth + RBAC + Personas
```
ROLES (id_rol PK, nombre UQ, descripcion)
  │ 1
  │ N
USUARIO_ROLES (id_usuario FK→usuarios + id_rol FK→roles, PK compuesta, rol_activo)
  │
  │ N
  │ 1
USUARIOS (id_usuario PK, email UQ, password_hash, activo)
  │
  ├──1:1──→ ALUMNOS (id_alumno PK, ci UQ, nombre, apellido, ..., id_usuario FK→usuarios)
  ├──1:1──→ DOCENTES (id_docente PK, ci UQ, nombre, apellido, ..., id_usuario FK→usuarios)
  └──1:1──→ ADMINISTRATIVOS (id_administrativo PK, ci UQ, nombre, apellido, cargo, ..., id_usuario FK→usuarios)

ROLES_PERMISOS (PK compuesta: id_rol FK→roles + id_permiso FK→permisos)
  │
  ├──→ ROLES
  └──→ PERMISOS (id_permiso PK, codigo UQ, descripcion)
```

### Cadena de resolución de permisos
`usuario_roles WHERE rol_activo=true` → `roles.id_rol` → `roles_permisos WHERE id_rol=X` → `permisos.id_permiso`

El backend resuelve esto en `_obtener_permisos()` (`dependencies.py:74`) al momento del login y mete los permisos en el JWT. El frontend lee `user().permisos` del token, no vuelve a pegarle a la BD.

### Archivos clave referenciados
- `PostgradoBackend/dependencies.py` — `_obtener_profile_info()` línea 84, `_obtener_permisos()` línea 74
- `PostgradoBackend/seed.py` — roles, permisos, asignaciones, seed de usuario admin
- `PostgradoBackend/routers/auth.py` — login, register, /me
- `Postgrado-Frontend/src/app/core/services/auth.service.ts` — AuthService con hasPermiso()
- `Postgrado-Frontend/src/app/shared/components/navbar/navbar.ts` — navItems filtrados por permiso
- `Postgrado-Frontend/src/app/core/config/app.routes.ts` — guards por permiso

## Sesión 2026-07-10 — Migración a roles múltiples (1 usuario = N roles)

### Cambio de modelo
- **Antes**: 1 usuario = 1 rol (`usuarios.id_rol` FK directa, unique `(email, id_rol)`)
- **Ahora**: 1 usuario = N roles (tabla intermedia `usuario_roles` con `rol_activo`)
- Se creó modelo `UsuarioRol` (PK compuesta: `id_usuario` + `id_rol`, campo `rol_activo`)
- Se eliminó `id_rol` de tabla `usuarios`, se eliminó constraint `uq_email_rol`
- Se agregó unique constraint `uq_email` en `usuarios` (un solo usuario por email)
- Se fusionaron 3 usuarios duplicados en 1 solo

### Backend modificado
- **models/usuario_rol.py**: nueva tabla intermedia
- **models/usuario.py**: eliminado `id_rol`, agregado `usuario_roles` relationship, propiedades `roles`, `rol_activo`, `id_rol_activo`
- **models/rol.py**: eliminado `usuarios`, agregado `usuario_roles`
- **dependencies.py**: `_obtener_permisos()` recibe `id_rol` del JWT, nuevo `_obtener_roles_usuario()`, JWT incluye `id_usuario` + `id_rol`
- **schemas/auth.py**: nuevo `LoginRequest` (sin `id_rol`), `SelectRolRequest`, `LoginStep1Response`, `RolInfo`, `UserResponse` con `roles[]`
- **schemas/admin.py**: `UserAdminResponse` con `roles[]` + `id_roles[]`, `UserAdminCreate` con `roles[]`, nuevo `UserUpdateRoles`
- **routers/auth.py**: login en 2 pasos — `POST /auth/login` retorna roles, `POST /auth/seleccionar-rol` retorna JWT; eliminado `POST /auth/register`
- **routers/usuarios.py**: `PUT /{id}/roles` reemplaza `PUT /{id}/rol`, crear usuario con `roles[]`
- **seed.py**: actualizado para usar `UsuarioRol`

### Frontend modificado
- **auth.service.ts**: `login()` solo email+pass, `seleccionarRol(id_rol)`, tipo `RolInfo`
- **login.ts/html**: flujo de 2 pasos (credentials → selección de rol), auto-selección de rol "alumno" cuando `inscribirId` está presente
- **admin.models.ts**: interfaces con `roles[]`
- **admin.service.ts**: `updateUserRoles()`
- **usuarios-list.ts/html**: columna roles + gestión con `RolesChangeDialog`
- **usuario-form.ts**: checkboxes múltiples para roles
- **admin-dialogs.ts**: nuevo `RolesChangeDialog`
- **navbar.ts**: usa `rol` en vez de `profile_type` para navItems
- **app.routes.ts**: `dashboardGuard` bloquea alumnos de `/dashboard`, redirección por rol

### Comportamiento de redirección post-login
| Rol seleccionado | Redirección |
|---|---|
| admin roles | `/dashboard` (panel admin) |
| docente | `/dashboard` |
| alumno | `/` (página pública con oferta académica) |
| alumno + `inscribirId` | `/alumnos/inscribir/:id` (flujo de inscripción) |

### Pendientes
- Bug #34: Navbar admin link "Alumnos" redirige al portal estudiante — falta vista de gestión de alumnos para admin
- Módulo pagos: modelo, endpoints y front
- Módulo notas: modelo, endpoints y front
- Endpoint dashboard: estadísticas del admin
- Filtrado de alumnos por período: endpoint `GET /alumnos/por-periodo/{id_periodo}`
- Subida de documentos por alumno + validación por admin

### Fix sesión 2026-07-12 — Multi-role bugs + docente + dashboard
1. Fix `_obtener_profile_info` ahora recibe `nombre_rol` para devolver el profile correcto según el rol seleccionado (antes siempre devolvía "alumno" para usuarios multi-rol)
2. Fix `seleccionar-rol` ahora filtra por `id_usuario` + `id_rol` (antes solo filtraba por `id_rol`, podía agarrar rol de otro usuario)
3. Fix `SelectRolRequest` ahora requiere `id_usuario` + `id_rol` (antes solo `id_rol`)
4. Fix `roles.py:eliminar_rol` ahora consulta `UsuarioRol` en vez de `Usuario.id_rol` (campo eliminado)
5. Eliminado schema obsoleto `UserChangeRol`
6. Navbar docente ahora muestra: Mi Perfil, Mis Alumnos, Oferta Académica (antes solo veía "Alumnos" que iba al portal de estudiante)
7. Login redirige docentes a `/docentes/:id_profile` en vez de `/dashboard` vacío
8. Seed docente ahora incluye permiso `docentes.ver`
9. Fix `GradoEnum` — seed usaba `"Licenciado"` pero el enum solo acepta `"Lic."`
10. Dashboard stats ahora carga datos reales: Programas, Docentes, Tipos, Alumnos (antes Tipos y Alumnos mostraban "—")
11. `AlumnoService` ahora tiene método `getAll()`
12. Link "Alumnos" en dashboard ahora apunta a `/alumnos` en vez de `/docentes`

### Archivos tocados
**Backend:**
- `dependencies.py` — `_obtener_profile_info` recibe `nombre_rol`
- `routers/auth.py` — `seleccionar-rol` filtra por `id_usuario` + `id_rol`, pasa `nombre_rol` a `_obtener_profile_info`
- `routers/roles.py` — `eliminar_rol` usa `UsuarioRol` en vez de `Usuario.id_rol`
- `schemas/auth.py` — `SelectRolRequest` con `id_usuario` + `id_rol`
- `schemas/admin.py` — eliminado `UserChangeRol`
- `seed.py` — grado `"Licenciado"` → `"Lic."`, docente incluye `docentes.ver`

**Frontend:**
- `auth.service.ts` — `seleccionarRol` recibe `id_usuario` + `id_rol`
- `login.ts` — almacena `loginUserId` del step1, pasa `id_usuario` a `seleccionarRol`
- `navbar.ts` — `docenteItems` array, navItems filtra por rol
- `home.ts` — inyecta `TipoProgramaService` + `AlumnoService`, carga stats
- `home.html` — stats reales, link Alumnos → `/alumnos`
- `alumno.service.ts` — nuevo método `getAll()`

## Sesión 2026-07-13 — Usuarios, Auth pública, seguridad y paginación

### Decisiones clave
- **Cada cuenta tiene `alumno` como rol base** — incluso docentes y admins también pueden ser alumnos (multi-perfil). Admin crear cuentas también les asigna alumno.
- **Flujo de registro público**: email + CI + password (mínimo) → crea `Usuario` + `UsuarioRol(alumno)` + `Alumno(nombre="Pendiente", apellido="Pendiente")` → el estudiante completa su perfil después desde `/alumnos/perfil`.
- **Admin crea usuarios**: Para docente y admin, el panel admin crea la cuenta con los roles que correspondan.
- **Profile edit con `exclude_unset=True`**: El backend usa este modo para no sobreescribir campos no enviados.
- **`fecha_nacimiento` validator**: El frontend envía ISO datetime, el backend trimea a date-only.

### Backend — Auth pública + seguridad (2026-07-13)
- `POST /auth/registro` — auto-inscripción pública, honeypot anti-bot, crea `Usuario` + `UsuarioRol(alumno)` + `Alumno` (nombre/apellido = "Pendiente")
- `PATCH /auth/cambiar-password` — requiere contraseña actual, nueva contraseña mín 6 chars
- **Rate limiter** (`rate_limiter.py`): diccionario en memoria, 5 intentos / 15 min por IP, solo aplica a `/auth/login`
- **Honeypot**: campo oculto en formulario registro, backend rechaza si viene lleno
- Fix: `bcrypt` downgrade 4.1.3→4.0.1 por incompatibilidad con passlib

### Backend — Usuarios admin (2026-07-13)
- `GET /usuarios` ahora retorna `PaginatedUsersResponse` con `items`, `total`, `page`, `per_page`, `pages`
- `PATCH /usuarios/{id}` — editar datos de usuario (email, CI, nombre, password)
- `_perfiles_info()` retorna todos los perfiles (no solo el primero)
- `crear_usuario` crea en transacción única + siempre agrega `UsuarioRol(alumno)`
- `actualizar_roles_usuario` con transacción + auto-protección (no desactivarse a sí mismo) + protección último admin
- `toggle_activo` con auto-protección + protección último admin

### Backend — Alumnos (2026-07-13)
- `PATCH /alumnos/mi-perfil` con `exclude_unset=True` para no sobreescribir campos
- `AlumnoUpdate.fecha_nacimiento` validator trimea ISO datetime a date-only

### Frontend — Registro (2026-07-13)
- Componente `register.ts` — formulario simplificado 3 campos (email, CI, password) + honeypot oculto
- `auth.service.ts` — nuevo método `register()` con `RegistroRequest` (incluye `honeypot`)
- Login: enlace "Crear cuenta" + `goToRegister()` preservando `inscribirId`
- Ruta `/registro` agregada

### Frontend — Perfil (2026-07-13)
- Diseño GitHub-style: avatar header con iniciales, datos personales (ver/editar), cambio de contraseña (ver/editar con validación de contraseña actual)
- `perfil.css` rediseñado completamente
- Corregido import path de AuthService (4 niveles, no 3)

### Frontend — Admin usuarios (2026-07-13)
- `admin.models.ts` — `ProfileInfo`, `UserAdminUpdate`, `PaginatedUsersResponse`
- `admin.service.ts` — `updateUser(id, data)` para PATCH
- `admin-dialogs.ts` — nuevo `UsuarioEditDialog` (editar email, password, CI, nombre, etc.)
- `usuarios-list` — tabla con perfiles expandidos, botón editar, paginación funcional (prev/next, page numbers, info)

### Frontend — Otros fixes (2026-07-13)
- Login muestra error de rate limit del backend en vez de "Credenciales inválidas"
- `NG8113` (unused imports) suprimido en `tsconfig.app.json`
- Navbar: "Mi Perfil" removido del nav, ahora está en el dropdown del icono `account_circle`
- Carrusel: redirect inteligente a `/alumnos/inscripciones` si ya estás inscrito en una edición
- Carrusel: bloqueo de inscripción si perfil incompleto (nombre/apellido = "Pendiente") con snackbar + redirect a perfil
- Onboarding: banner amarillo en home para alumnos con perfil incompleto ("Completá tu perfil para inscribirte")
- Perfil: removida validación de largo de contraseña (el backend ya valida)

### Backend — Roles protecciones (2026-07-13)
- `PUT /roles/{id}`: no se puede quitar `roles.gestionar` de un rol que tiene usuarios asignados
- `PUT /roles/{id}`: no se puede quitar `roles.gestionar` del propio rol activo del usuario logueado
- `POST /roles/asignaciones/batch`: ahora reporta errores (IDs inválidos) en vez de skipear silenciosamente

### Archivos tocados
**Backend:**
- `routers/auth.py` — registro, cambiar-password, rate limiting en login
- `routers/usuarios.py` — paginación, PATCH editar, transacciones, auto-protección
- `schemas/auth.py` — `RegistroRequest`, `CambiarPasswordRequest`
- `schemas/admin.py` — `ProfileInfo`, `UserAdminUpdate`, `PaginatedUsersResponse`
- `schemas/alumno.py` — `fecha_nacimiento` validator
- `rate_limiter.py` — nuevo: rate limiter en memoria

**Frontend:**
- `core/services/auth.service.ts` — `register()`, `cambiarPassword()`, `RegistroRequest`
- `features/login/pages/register.ts/html/css` — nuevo componente registro
- `features/login/pages/login.ts` — `goToRegister()`, error de rate limit
- `features/alumno/pages/perfil/perfil.ts/html/css` — rediseño completo GitHub-style
- `features/admin/models/admin.models.ts` — `ProfileInfo`, `UserAdminUpdate`, `PaginatedUsersResponse`
- `features/admin/services/admin.service.ts` — `updateUser()`, `getAllUsers()` paginado
- `features/admin/pages/admin-dialogs.ts` — `UsuarioEditDialog`
- `features/admin/pages/usuarios-list.ts/html/css` — perfiles, paginación, edit button
- `features/public-home/pages/public-home.ts/html/css` — onboarding banner, redirect inscripción duplicada, redirect perfil incompleto
- `shared/components/navbar/navbar.ts/html` — "Mi Perfil" en dropdown de usuario
- `core/config/app.routes.ts` — ruta `/registro`
- `tsconfig.app.json` — suppress NG813

**Backend (roles):**
- `routers/roles.py` — protecciones en `actualizar_rol` (no quitar `roles.gestionar` de rol con usuarios ni del rol propio), batch endpoint reporta errores

### Pulido visual — Roles + Usuarios (2026-07-13)

**roles-list.ts/html/css:**
- Quitado botón eliminar (no se borran roles)
- Quitado badge "Seed" (roles son fijos pero gestionables)
- Solo queda botón editar

**rol-form.ts:**
- Header con icono degradado + subtítulo
- Secciones en cards (`#f8fafc` con borde sutil)
- Barra de progreso de permisos seleccionados
- Accordion custom (sin `mat-expansion-panel`) con chevron animado
- Checkbox indeterminado para grupos con permisos parciales
- Badge con conteo de permisos totales
- Botones con iconos + spinner inline

**usuario-form.ts:**
- Header con icono degradado cyan + subtítulo
- Secciones cards: Credenciales, Roles, Datos personales
- Roles en lista vertical tipo chips (checkbox + nombre + descripción en una línea)
- Badge con conteo de roles seleccionados
- Botones con iconos + spinner inline
- Diálogo ancho: 520px

**styles.css:**
- Agregado `.status-dot` / `.status-dot.active` global (8px red/green dot)

### Archivos tocados
- `features/admin/pages/roles-list.ts/html/css` — removidos botón eliminar y badge seed
- `features/admin/pages/rol-form.ts` — rediseño completo con sections cards
- `features/admin/pages/usuario-form.ts` — rediseño completo con role chips list
- `features/admin/pages/usuarios-list.ts` — diálogo ancho 520px
- `styles.css` — status-dot global

### Pendientes
- Bug #34: Navbar admin tiene link "Alumnos" que redirige al portal estudiante — no hay gestión de alumnos para admin
- Subida de documentos (requisitos) por parte del alumno + validación por admin
- Módulo pagos
- Módulo notas
- Endpoint dashboard: estadísticas del admin
- Filtrado de alumnos por período
- Refinar contraste y diferenciación visual

### Decisiones de diseño — Documentación y descuentos (2026-07-13)

**RBAC flexible:** Se mantiene. Los 4 roles (director, docente, alumno, administrativo) son la base, pero el sistema permite crear roles nuevos. "Administrativo" es el actor global, con sub-flexibilidad via permisos.

**Sin `programa_usuario`:** Cada rol administrativo tiene acceso a TODOS los programas. Son pocos (~7 al año, 4 administrativos), no justifica scope por programa.

**Nueva tabla `modalidad_tipo_descuento`:** Junction table (M:N) que define qué descuentos aplican a qué modalidades. Ejemplo: "Beca 50%" solo para "Educación Continua".

**`requisitos.id_modalidad_academica` nullable:** Permite documentos genéricos (para descuentos) que no pertenecen a ninguna modalidad específica. Los requisitos de modalidad tienen FK, los de descuento tienen FK = NULL.

**Flujo de `control_documentacion`:**
1. Alumno elige modalidad → se generan registros por cada requisito de esa modalidad
2. Alumno elige descuento → se verifica en `modalidad_tipo_descuento` si aplica para esa modalidad
3. Si aplica → se genera un `control_documentacion` extra (obligatorio=true)
4. Admin va checkeando cada registro: pendiente → entregado → aprobado/rechazado

**Próximo módulo:** Gestión de documentación (admin revisa postulantes de una edición y checkea documentos)

### Módulos completados
- ✅ **usuarios** — CRUD, auth pública, rate limiting, honeypot, paginación, cambio contraseña, onboarding, formulario rediseñado
- ✅ **roles** — CRUD con permisos, protecciones RBAC, batch endpoint, formulario rediseñado

## Sesión 2026-07-13 — Documentación, Modalidades y Descuentos (Junction Tables)

### Decisiones de diseño
- **RBAC flexible (confirmado):** Se mantiene dynamic roles. "Administrativo" es el actor global con sub-flexibilidad via permisos.
- **Sin `programa_usuario` (confirmado):** Cada rol administrativo tiene acceso a TODOS los programas (~7/año, 4 admins).
- **Junction tables M:N:**
  - `modalidad_tipo_descuento` — define qué descuentos aplican a qué modalidades (ej: Beca 50% solo para Educación Continua)
  - `tipo_descuento_requisito` — define qué documentos requiere cada descuento (ej: Beca 50% requiere "Media Beca UAGRM")
- **`requisitos.id_modalidad_academica` nullable:** Documentos para descuentos tienen FK = NULL.
- **Flujo de control_documentacion:**
  1. Alumno elige modalidad → se generan control_documentacion por cada requisito de esa modalidad
  2. Alumno elige descuento → backend verifica en `modalidad_tipo_descuento` si aplica para esa modalidad
  3. Si aplica → se genera un `control_documentacion` extra (obligatorio=true) con los requisitos del descuento

### Backend — Junction Tables (2026-07-13)
- **Nuevos modelos:** `models/modalidad_tipo_descuento.py`, `models/tipo_descuento_requisito.py`
- **Migración:** `migrate_junction_tables.py` — crea tablas, migra datos existentes, elimina columnas obsoletas
- **Modelos modificados:**
  - `requisito.py`: FK `id_modalidad_academica` ahora nullable, relationship `tipos_descuento` via secondary
  - `tipo_descuento.py`: eliminados `id_requisito_extra` y `requiere_documento`, agregadas relationships `modalidades` y `requisitos` via secondary
  - `modalidad_academica.py`: agregada relationship `tipos_descuento` via secondary
  - `detalle_programa_alumno.py`: eliminada relationship duplicada `control_documentacion`
- **Schemas modificados:**
  - `requisito.py`: `id_modalidad_academica` optional en Create/Update, Response incluye `modalidad_academica` nullable
  - `tipo_descuento.py`: eliminados `requiere_documento`/`id_requisito_extra`, agregados `modalidades: list[int]` y `requisitos: list[int]`
- **Routers modificados:**
  - `tipo_descuento.py`: reescrito con `_sincronizar()` para junction tables, `_cargar_con_relations()` con joinedload
  - `detalle_programa_alumno.py`: agregada `generar_control_descuento()` — verifica `ModalidadTipoDescuento`, genera docs extra
  - `programa_version_edicion.py`: agregado `GET /{id}/postulantes` — retorna alumnos con control_documentacion y contadores

### Backend — Seed (2026-07-13)
- Agregada modalidad "Profesionales"
- Agregado requisito "Media Beca UAGRM" (FK nullable, para descuentos)
- Agregados tipos de descuento: "Beca 50%" (solo Educación Continua) y "Descuento 10% Pago al Contado" (ambas modalidades)
- Datos junction: Beca 50% requiere "Media Beca UAGRM"
- Agregados permisos: `modalidades_academicas.crear`, `requisitos.eliminar`, `tipos_descuento.eliminar`

### Frontend — Documentación (2026-07-13)
- **`documentacion.ts`:** Componente para que el admin académico revise postulantes por edición
  - Selector de edición con nombre de programa
  - Lista expandible de postulantes con avatar, CI, correo, barra de progreso mini
  - Panel expandido con documentos: estados visuales (pendiente/entregado/aceptado/rechazado)
  - Acciones: marcar entregado, aprobar, rechazar con prompt de observaciones
- **`admin.models.ts`:** Interfaces `PostulanteResponse`, `ControlDocumentacionResponse/Update`, `ProgramaVersionEdicionResponse`
- **`admin.service.ts`:** Métodos `getEdiciones()`, `getPostulantesPorEdicion()`, `updateControlDocumentacion()`

### Frontend — Modalidades Académicas (2026-07-13)
- **`modalidad-list.ts`:** Lista de modalidades con icono, nombre, descripción, estado
- **`modalidad-form.ts`:** Formulario dialog con:
  - Campos: nombre, descripción, requiere_titulo, uso_unico, estado
  - Sección de requisitos documentales: agregar, eliminar, toggle obligatorio
  - CRUD completo vía service

### Frontend — Tipos de Descuento (2026-07-13)
- **`tipo-descuento-list.ts`:** Lista con nombre, badge porcentaje, tags de modalidades y requisitos
- **`tipo-descuento-form.ts`:** Formulario dialog con:
  - Campos: nombre, porcentaje, descripción, estado
  - Multi-select de modalidades (checkbox chips) — dónde aplica
  - Multi-select de requisitos (checkbox chips) — documentos que requiere
  - Chips muestran hint de modalidad o "Global" para requisitos sin FK

### Frontend — Admin Panel Updates (2026-07-13)
- **`admin.ts`:** Agregadas pestañas Modalidades, Descuentos, Documentación
- **`admin.routes.ts`:** Nuevas rutas `/admin/modalidades`, `/admin/descuentos`, `/admin/documentacion`
- **`admin.service.ts`:** Métodos CRUD para modalidades, requisitos, tipos de descuento

### Archivos tocados
**Backend:**
- `models/modalidad_tipo_descuento.py` — nuevo
- `models/tipo_descuento_requisito.py` — nuevo
- `models/__init__.py` — imports de nuevos modelos
- `models/detalle_programa_alumno.py` — eliminada relationship duplicada
- `models/modalidad_academica.py` — relationship tipos_descuento
- `models/requisito.py` — FK nullable, relationship tipos_descuento
- `models/tipo_descuento.py` — eliminados campos obsoletos, relationships via secondary
- `schemas/requisito.py` — FK optional, Response con modalidad_academica
- `schemas/tipo_descuento.py` — modalidades[] y requisitos[]
- `routers/tipo_descuento.py` — CRUD con junction tables
- `routers/detalle_programa_alumno.py` — generar_control_descuento()
- `routers/programa_version_edicion.py` — endpoint postulantes
- `seed.py` — datos junction, permisos faltantes
- `migrate_junction_tables.py` — script de migración

**Frontend:**
- `features/admin/pages/documentacion.ts` — nuevo componente
- `features/admin/pages/modalidad-list.ts` — nuevo componente
- `features/admin/pages/modalidad-form.ts` — nuevo componente
- `features/admin/pages/tipo-descuento-list.ts` — nuevo componente
- `features/admin/pages/tipo-descuento-form.ts` — nuevo componente
- `features/admin/models/admin.models.ts` — interfaces actualizadas
- `features/admin/services/admin.service.ts` — métodos CRUD agregados
- `features/admin/pages/admin.ts` — tabs actualizadas
- `features/admin/routes/admin.routes.ts` — rutas agregadas

### Pendientes
- Bug #34: Navbar admin tiene link "Alumnos" que redirige al portal estudiante — no hay gestión de alumnos para admin
- Módulo pagos: modelo, endpoints y front
- Módulo notas: modelo, endpoints y front
- Endpoint dashboard: estadísticas del admin
- Filtrado de alumnos por período
- Refinar contraste y diferenciación visual

## Sesión 2026-07-14 — Mover uso_unico, enum estados y validación descuento

### Decisiones de diseño
- **`uso_unico` movido de `ModalidadAcademica` → `TipoDescuento`**: Educación continua no es uso único (se puede hacer para varias carreras). La beca 50% sí es uso único (el alumno la "reserva" para usarla cuando quiera, ej: maestría).
- **Enum de estados actualizado**: eliminado `convalidando`, agregado `observado` (en vez de `rechazado` para que el alumno pueda corregir).
- **Validación de uso único en descuento**: si `tipo_descuento.uso_unico=true`, se verifica que el alumno no lo haya usado antes (excluyendo estados `postulante` y `observado`).

### Backend — Migración
- `b1c2d3e4f5a6` — une los 2 heads anteriores, crea columna `uso_unico` en `tipos_descuento`, migra datos (Beca 50% = true), elimina `uso_unico` de `modalidades_academicas`.
- Para aplicar: `./venv/bin/alembic upgrade head && python seed.py`

### Backend — Archivos modificados
- `models/modalidad_academica.py` — eliminado `uso_unico`
- `models/tipo_descuento.py` — agregado `uso_unico` + import `Boolean`
- `schemas/modalidad_academica.py` — eliminado `uso_unico` de Base y Update
- `schemas/tipo_descuento.py` — agregado `uso_unico` a Base y Update
- `schemas/detalle_programa_alumno.py` — enum: eliminado `convalidando`, agregado `observado`
- `routers/detalle_programa_alumno.py` — validación de uso único en `crear` y `auto_insribir` (excluyendo postulante/observado)
- `seed.py` — Beca 50% con `uso_unico=True`
- `migrations/versions/b1c2d3e4f5a6_mover_uso_unico_de_modalidad_a_descuento.py` — nueva migración

### Frontend — Archivos modificados
- `features/admin/pages/modalidad-form.ts` — quitado checkbox `uso_unico` del template y form
- `features/admin/pages/modalidad-list.ts` — quitado badge "Uso único"/"Uso libre"
- `features/admin/pages/tipo-descuento-form.ts` — agregado checkbox `uso_unico` en template, form y styles
- `features/admin/models/admin.models.ts` — `uso_unico` removido de `ModalidadAcademicaResponse`, agregado a `TipoDescuentoResponse`

### Pendientes (actualizados)
- **Restricción modalidad × tipo de programa**: Educación continua solo para diplomados. Maestrías solo permiten "Profesionales". Validación en router (5 líneas), sin tablas nuevas.
- **Acoplamiento de estudiantes entre ediciones**: Campo `modulo_inicio` en `DetalleProgramaAlumno` (default=1). Permite que un estudiante empiece desde un módulo intermedio de una edición.
- Bug #34: Navbar admin link "Alumnos" redirige al portal estudiante — falta gestión de alumnos para admin
- Subida de documentos (requisitos) por parte del alumno + validación por admin
- Módulo pagos: modelo, endpoints y front
- Módulo notas: modelo, endpoints y front
- Endpoint dashboard: estadísticas del admin
- Filtrado de alumnos por período
- Refinar contraste y diferenciación visual

## Próximos pasos acordados (pendientes de implementar)

### 1. Restricción modalidad × tipo de programa
- Implementada via junction table `modalidad_tipo_programa` (M:N).
- Backend valida en `auto_insribir` y `crear` que la modalidad elegida esté vinculada al tipo de programa.
- Frontend: formulario de tipo de programa permite seleccionar modalidades permitidas.
- **Completado.**

### 2. Acoplamiento de estudiantes entre ediciones
- Agregar campo `modulo_inicio` (Integer, default=1) a `DetalleProgramaAlumno`
- Migración para la columna nueva
- Schema: agregar campo a Create/Update/Response
- Router: permitir enviar `modulo_inicio` al inscribirse
- Frontend: campo opcional en formulario de inscripción (admin puede indicar desde qué módulo empieza el alumno)

## Sesión 2026-07-14 — Junction tables: modalidad_tipo_programa

### Decisiones de diseño
- **Junction table `modalidad_tipo_programa`** (PK compuesta: `id_modalidad_academica` + `id_tipo_programa`, cascade delete): define qué modalidades aplican a qué tipo de programa.
- **Validación en backend**: en `auto_insribir` y `crear` del router `detalle_programa_alumno.py`, se verifica que la modalidad elegida esté vinculada al tipo de programa vía la junction table.
- **Seed**: Diplomado ↔ Educación Continua + Profesionales; Maestría ↔ Profesionales; Curso ↔ Profesionales.

### Backend — Archivos creados
- `models/modalidad_tipo_programa.py` — nuevo modelo con PK compuesta + cascade
- `migrations/versions/c2d3e4f5a6b7_crear_modalidad_tipo_programa.py` — crea la tabla

### Backend — Archivos modificados
- `models/__init__.py` — import de `ModalidadTipoPrograma`
- `models/tipo_programa.py` — relationship `modalidades` via secondary
- `models/modalidad_academica.py` — relationship `tipos_programa` via secondary
- `schemas/tipo_programa.py` — `modalidades: list[int]` en Create/Update, `modalidades: list[ModalidadAcademicaResponse]` en Response
- `routers/tipo_programa.py` — CRUD reescrito con `_sincronizar()` para junction tables, `joinedload` para eager loading
- `routers/detalle_programa_alumno.py` — función `validar_modalidad_programa()` llamada en `crear` y `auto_insribir`
- `seed.py` — crea TiposPrograma + junctions

### Migración aplicada
- Tabla `modalidad_tipo_programa` creada manualmente (la cadena de migraciones tenía un huérfano `a1b2c3d4e5f6`).
- Migración `b1c2d3e4f5a6` (uso_unico) ejecutada manualmente (stamp no ejecuta upgrade).
- Alembic stamp en HEAD: `c2d3e4f5a6b7`.

### Frontend — Feature module existente actualizado (NO se crearon componentes nuevos en admin)
- **Decisión**: no duplicar CRUD en admin panel. Se actualizó el feature module `/tipos-programa` existente.
- `models/tipo-programa.model.ts` — `TipoPrograma` incluye `modalidades: ModalidadResumen[]`, `TipoProgramaCreate` incluye `modalidades: number[]`
- `services/tipo-programa.service.ts` — nuevo método `getModalidades()` importando `ModalidadAcademicaResponse` de admin.models
- `pages/tipo-programa-form/tipo-programa-form.ts` — carga modalidades, `selectedModalidades` signal, `toggleModalidad()`, envía `modalidades: number[]` en payload
- `pages/tipo-programa-form/tipo-programa-form.html` — sección "Modalidades permitidas" con checkbox chips
- `pages/tipo-programa-form/tipo-programa-form.css` — estilos para chips, section-divider, section-header
- `pages/tipo-programa-list/tipo-programa-list.ts` — columna `modalidades` agregada a `columnas[]`
- `pages/tipo-programa-list/tipo-programa-list.html` — columna `modalidades` con chips de color
- `pages/tipo-programa-list/tipo-programa-list.css` — estilos `.modalidades-chips`, `.mod-chip`, `.no-mods`

### Frontend — Admin panel limpiado
- Eliminados `admin/pages/tipo-programa-list.ts` y `admin/pages/tipo-programa-form.ts`
- Eliminada pestaña "Tipos de Programa" de `admin/pages/admin.ts`
- Eliminada ruta `tipos-programa` de `admin/routes/admin.routes.ts`
- Eliminados métodos `getTiposPrograma`, `createTipoPrograma`, `updateTipoPrograma` de `admin/services/admin.service.ts`
- Eliminado import `TipoProgramaResponse` de `admin.service.ts` (se mantiene en `admin.models.ts` para `ProgramaResponse`)

## Sesión 2026-07-14 — Refactor Frontend: Split del admin feature en features independientes

### Problema
El feature `admin` era un monolito: un solo `admin.models.ts` (225 líneas, 22 interfaces), un solo `admin.service.ts` (117 líneas, 40+ métodos), un `admin-dialogs.ts` (264 líneas, 3 diálogos), y 12 componentes en `pages/` (8 con templates inline). Todo estaba mezclado sin separación por dominio.

### Solución implementada
Cada feature ahora es un directorio independiente bajo `src/app/features/`:

**Estructura final:**
```
features/
  admin/                    ← solo el shell (tabs + routes)
    pages/admin/admin.ts + .html + .css
    routes/admin.routes.ts
  roles/
    models/roles.model.ts
    services/roles.service.ts
    pages/roles-list/roles-list.ts + .html + .css
    pages/rol-form/rol-form.ts + .html + .css
  usuarios/
    models/usuarios.model.ts
    services/usuarios.service.ts
    pages/usuarios-list/usuarios-list.ts + .html + .css
    pages/usuario-form/usuario-form.ts + .html + .css
    dialogs/roles-change-dialog.ts + .html + .css
    dialogs/usuario-edit-dialog.ts + .html + .css
  modalidad/
    models/modalidad.model.ts
    services/modalidad.service.ts
    pages/modalidad-list/modalidad-list.ts + .html + .css
    pages/modalidad-form/modalidad-form.ts + .html + .css
  tipo-descuento/
    models/tipo-descuento.model.ts
    services/tipo-descuento.service.ts
    pages/tipo-descuento-list/tipo-descuento-list.ts + .html + .css
    pages/tipo-descuento-form/tipo-descuento-form.ts + .html + .css
  documentacion/
    models/documentacion.model.ts
    services/documentacion.service.ts
    pages/documentacion/documentacion.ts + .html + .css
```

### Cambios realizados
1. **Modelos**: `admin.models.ts` (22 interfaces) → 5 archivos de modelo independientes por feature
2. **Servicios**: `admin.service.ts` (40+ métodos) → 5 servicios independientes (roles, usuarios, modalidad, tipo-descuento, documentacion)
3. **Componentes**: todos con `.ts + .html + .css` separados (ninguno con template inline)
4. **Diálogos**: `admin-dialogs.ts` → `usuarios/dialogs/roles-change-dialog` + `usuarios/dialogs/usuario-edit-dialog`
5. **ConfirmDialog unificado**: eliminado el duplicado en admin, ahora se usa el shared (`ConfirmDialogComponent` con `{ titulo, mensaje }`)
6. **Admin shell**: `admin.ts` movido a `pages/admin/admin.ts` con template/estilos separados
7. **Rutas actualizadas**: `admin.routes.ts` apunta a las nuevas ubicaciones de cada feature
8. **Imports cruzados**: `tipo-programa.service.ts` y `tipo-programa-form.ts` actualizados para importar de `modalidad/models/modalidad.model` en vez de `admin.models`
9. **Archivos eliminados**: `admin/pages/` (16 archivos viejos), `admin/services/admin.service.ts`, `admin/models/admin.models.ts`, `admin/pages/admin-dialogs.ts`

### Archivos eliminados
- `admin/pages/roles-list.ts`, `.html`, `.css`
- `admin/pages/rol-form.ts`
- `admin/pages/usuarios-list.ts`, `.html`, `.css`
- `admin/pages/usuario-form.ts`
- `admin/pages/modalidad-list.ts`
- `admin/pages/modalidad-form.ts`
- `admin/pages/tipo-descuento-list.ts`
- `admin/pages/tipo-descuento-form.ts`
- `admin/pages/documentacion.ts`
- `admin/pages/admin-dialogs.ts`
- `admin/pages/admin.ts`
- `admin/services/admin.service.ts`
- `admin/models/admin.models.ts`

### Archivos creados (43 archivos nuevos)
- `roles/`: model, service, 2 componentes (ts+html+css cada uno) = 7 archivos
- `usuarios/`: model, service, 2 componentes (ts+html+css), 2 diálogos (ts+html+css) = 11 archivos
- `modalidad/`: model, service, 2 componentes (ts+html+css) = 7 archivos
- `tipo-descuento/`: model, service, 2 componentes (ts+html+css) = 7 archivos
- `documentacion/`: model, service, 1 componente (ts+html+css) = 4 archivos
- `admin/`: admin.ts + admin.html + admin.css + admin.routes.ts = 4 archivos (actualizados)

### Archivos modificados (imports actualizados)
- `admin/routes/admin.routes.ts` — importa AdminComponent de `pages/admin/admin`, lazy loads desde nuevas ubicaciones
- `tipo-programa/services/tipo-programa.service.ts` — import de `modalidad/models/modalidad.model`
- `tipo-programa/pages/tipo-programa-form/tipo-programa-form.ts` — import de `modalidad/models/modalidad.model`

### Verificación
- `npx tsc --noEmit` → 0 errores
- URLs preservadas: `/admin/roles`, `/admin/usuarios`, `/admin/modalidades`, `/admin/descuentos`, `/admin/documentacion`

### Pendientes
- Bug #34: Navbar admin link "Alumnos" redirige al portal estudiante — falta gestión de alumnos para admin
- Subida de documentos por alumno + validación por admin
- Módulo pagos
- Módulo notas
- Endpoint dashboard: estadísticas del admin
- Filtrado de alumnos por período
- Refinar contraste y diferenciación visual
