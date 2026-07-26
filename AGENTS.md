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

Stack: Angular 21 (standalone, Material M3, Signals + RxJS) + FastAPI + SQLAlchemy + PostgreSQL
BD: postgresql local (ver .env en backend)
Backend: github.com/Julio7-7-7/PostgradoBackend
Nombre del usuario: **Julio** (no "julius" — eso es solo el system user)

## Patrones del sistema (REGLAS — no violar)

- **NO HAY DELETE FÍSICOS** — Este sistema NO usa `DELETE` endpoints. Todo soft delete se hace vía `PATCH` con `estado: 'inactivo'` (o equivalente). Las tablas de catálogo (programas, docentes, requisitos, etc.) usan este patrón. Las tablas transaccionales (notas, pagos, inscripciones) NO se borran — solo se crean y editan. NO crear endpoints DELETE ni botones de eliminar en el frontend.
- **Collapsible inactive** — Las listas muestran activos por defecto + sección colapsable "Inactivos (N)" con chevron animado. No usar tabs para activos/inactivos.
- **Soft delete pattern** — Backend: `PATCH /{id}/cambiar-estado` con `estado: 'activo'|'inactivo'`. Frontend: toggle con `ConfirmDialog`.
- **Signals first** — Estado del componente con `signal()`, derivaciones con `computed()`, efectos con `effect()`. No usar BehaviorSubjects ni propiedades plain para estado reactivo.
- **Standalone components** — Todos los componentes son standalone. No declarar en NgModule.
- **Feature modules** — Cada feature es un directorio independiente bajo `features/`: models/, services/, pages/, routes/.
- **Upload pattern** — Base64 → `/media/` folder, reuse `guardar_documento_base64()` / `guardar_foto_base64()` from `routers/utils.py`. Max 10MB. MIME validation via magic bytes.
- **Document URLs** — All document/comprobante URLs must be prefixed with `environment.apiUrl`.
- **Commit pattern** — `flush()` → sync helpers → single `commit()` (never double/triple commit).
- **No physical DELETEs for notas** — Business rule. Notas can only be created and edited, never deleted.
- **Nota classification** — Unified to backend enum `NotaCalificacion`. Frontend uses `clasificarNota()` from `core/utils/nota-utils.ts`.
- **Rounding** — Backend `redondear_nota()` uses `math.floor(nota + 0.5)`. Frontend `Math.floor(n + 0.5)` to match.

## Guías de diseño
- `DESIGN.md` — identidad visual: azul FICH (#1e3a8a), sin glassmorphism, sin bordered-left, sombras parcas, croma mínimo
- `PRODUCT.md` — institucional moderno, anti-template genérico, animaciones con propósito (<300ms), estados vacío/loading/error obligatorios

## Feature colors system
- `--fich-feature-programa: #1e3a8a` / `-light: #eef2ff`
- `--fich-feature-tipo-programa: #7c3aed` / `-light: #f5f3ff`
- `--fich-feature-docente: #0d9488` / `-light: #f0fdfa`
- `--fich-feature-contratacion: #d97706` / `-light: #fffbeb`
- `--fich-feature-alumno: #0891b2` / `-light: #ecfeff`
- `--fich-feature-edicion: #4f46e5` / `-light: #eef2ff`
- `--fich-feature-modulo: #0d9488` / `-light: #f0fdfa`
- `--fich-feature-requisitos: #0d9488` / `-light: #f0fdfa`

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

## Módulos completados

- **auth/RBAC** — Login 2 pasos (credentials → selección de rol → JWT), roles múltiples por usuario, 47 permisos, guards por permiso, navbar dinámico
- **usuarios** — CRUD, auth pública, rate limiting, honeypot, paginación, cambio contraseña, onboarding, multi-role, formulario rediseñado
- **roles** — CRUD con permisos, protecciones RBAC (no quitar permiso propio ni de rol con usuarios), batch endpoint
- **programas** — CRUD completo, versiones, ediciones, módulos, horarios, contrataciones docente
- **requisitos** — CRUD con imagen upload, junction table M2M (`modalidad_requisito`), soft delete, detalle público `/requisitos/:id`
- **modalidades** — CRUD con junction table `modalidad_tipo_programa`, requisitos M2M via `modalidad_requisito`, sin `requiere_titulo` (es un requisito regular)
- **tipos_descuento** — CRUD con junction tables `modalidad_tipo_descuento` y `tipo_descuento_requisito`, `uso_unico` (movido de modalidad)
- **documentacion** — revisión de postulantes por edición con estados de documentos
- **inscripciones** — auto-inscripción, detalle por edición, cross-edition transfer (incorporación), historial de transferencias
- **alumnos** — portal estudiante: perfil, inscripciones, oferta académica, checklist documentos, subida de docs
- **pagos** — landing por edición, registro con comprobante upload, validación de monto vs cuota
- **notas** — landing por edición, registro/edición de notas, notas por docente, notas por módulo, transcript multi-edición con snake progress bar
- **docente portal** — módulos del docente agrupados por edición, calificación inline desde módulo
- **transcript** — historial académico multi-edición, snake progress bar, historial de transferencias, header con avatar
- **acoplamiento ediciones** — campo `modulo_inicio`, transferencia cross-edition, `avance_modulo` bridge table

## Decisiones de diseño clave

### Auth + RBAC
- Login con correo+contraseña (no CI/pasaporte)
- Admin que también es estudiante → misma cuenta con múltiples roles (tabla `usuario_roles`)
- Cada cuenta tiene `alumno` como rol base — incluso docentes y admins también pueden ser alumnos
- `administrativos` es una sola tabla (no por cargo). La diferencia entre legal/contable/director/pasante está en los permisos vía rol
- RBAC flexible: roles gestionables desde panel admin, permisos como catálogo de acciones
- Sin `programa_usuario`: cada rol administrativo tiene acceso a TODOS los programas (~7/año, 4 admins)
- JWT claims: `id_usuario`, `id_rol`, `id_profile`, `email`, `permisos[]`

### Junction tables M:N
- `modalidad_requisito` — requisitos documentales por modalidad
- `modalidad_tipo_descuento` — descuentos aplicables por modalidad
- `tipo_descuento_requisito` — documentos requeridos por descuento
- `modalidad_tipo_programa` — modalidades permitidas por tipo de programa

### Flujo de control_documentacion
1. Alumno elige modalidad → se generan registros por cada requisito de esa modalidad (vía `modalidad_requisito`)
2. Alumno elige descuento → backend verifica en `modalidad_tipo_descuento` si aplica
3. Si aplica → se genera un `control_documentacion` extra (obligatorio=true) con los requisitos del descuento
4. Admin va checkeando cada registro: pendiente → entregado → aprobado/rechazado

### Estados del alumno en inscripción
`postulante → observado → inscrito → incorporado → finalizado → graduado` (también `retirado`)
- `retirado → postulante` permitido (para reinscripción después de retiro)
- `TRANSICIONES_ESTADO` validado en backend, estricto
- `retirados` excluidos de transcript pero colapsables en notas-edicion

### Notas
- `ESTADOS_CON_CALIFICACION`: `{"inscrito", "incorporado", "finalizado", "graduado"}`
- `redondear_nota()`: `math.floor(nota + 0.5)` — siempre redondea .5 hacia arriba
- Unique constraint: `uq_nota_alumno_modulo` en `(id_detalle_programa_alumno, id_detalle_programa_modulo)`
- `NotaDialogData` interface for dialog injection (not `any`)

### Cross-edition enrollment
- `historial_inscripcion` — tracks transfer origin/destination + motivo
- `solicitud_incorporacion` — solicitud estudiantil con carta, aprobación admin, creación DPA con `es_incorporacion=true`
- Transcript se construye con `notas` + `detalle_programa_modulo` + `detalle_programa_alumno` — sin tabla intermedia
- Business rule: when reporting to "escuela de postgrado", everything normalized to destination edition
- `es_incorporacion` — metadata booleana en DPA, state machine sin cambios
- `modulo_inicio` — módulo desde el cual inicia el alumno en la edición destino

### Simplificación de diseño (2026-07-25)
- Eliminada tabla `avance_modulo` — era redundante, nadie la llenaba automáticamente
- Eliminado `nota.id_programa_version_edicion` — la edición se deriva de `detalle_programa_modulo.id_programa_version_edicion`
- Transcript endpoint movido de `routers/avance_modulo.py` a `routers/nota.py`
- Transcript schemas movidos de `schemas/avance_modulo.py` a `schemas/nota.py`
- Regla: no crear FKs redundantes — si la info se puede derivar de otra tabla, no duplicar

## Open Design (herramienta de diseño AI)
- Instalado en `~/Programación/open-design/` (v0.14.1, git clone + pnpm install)
- Daemon: `node apps/daemon/bin/od.mjs --port <puerto> --no-open`
- Daemon no funciona con `pnpm tools-dev` (error: "desktop did not expose status in time")
- Se usa vía CLI directa

## Archivos relevantes
- `~/Programación/Postgrado-Frontend/` — proyecto Angular
- `~/Programación/Postgrado-Frontend/src/material-theme.scss` — tema Material + variables
- `~/Programación/Postgrado-Frontend/src/styles.css` — estilos globales + feature colors
- `~/Programación/PostgradoBackend/` — proyecto FastAPI
- `~/Programación/PostgradoBackend/routers/utils.py` — utilidades de upload (base64 → media/)
- `~/Programación/PostgradoBackend/models/` — modelos SQLAlchemy
- Database: `PGPASSWORD=adminjt psql -h localhost -U julius -d postgrado`

## Pendientes

- **Bug #34**: Navbar admin tiene link "Alumnos" (`/alumnos`) que redirige al portal estudiante — no hay vista de gestión de alumnos para admin
- **Refinar contraste y diferenciación visual general**
- **Subida de documentos por parte del alumno** — funcionalidad completa (subir archivo al servidor, no solo ver requisitos)
- **Matriz visual rol × permiso** (opcional, postergable)

## Hecho reciente (2026-07-26)
- **Flujo de incorporación rediseñado** — flujo invertido (alumno inscribe primero, DPA creado, solicitud vinculada)
  - **Primera incorporación** (ediciones `en_curso`): `POST /solicitar` crea DPA (`postulante`, `es_incorporacion=true`) + Solicitud (`pendiente`)
  - **Segunda incorporación / migración**: `POST /solicitar` SIN `id_programa_version_edicion` → crea solo Solicitud. Admin elige edición → `PATCH /{id}/aprobar` crea DPA directamente como `inscrito`
  - **Transferencia**: Ya NO crea `solicitud_incorporacion` — `historial_inscripcion` registra la transferencia
  - **Aprobación admin**: Primera incorporación → DPA va a `postulante`; Migración → DPA va directo a `inscrito`
  - **Rechazo admin**: Solicitud → `rechazado`, DPA queda `postulante`
- **Backend simplificado**: `autoInscribir()` ya no acepta `es_incorporacion`/`id_solicitud` (esas funciones las maneja `solicitarIncorporacion`). `transferir()` ya no crea solicitud.
- **Frontend unificado**: `solicitar-incorporacion` es ahora una página única que funciona tanto para primera incorporación (con `/:idEdicion`) como para migración (sin param). Formulario de modalidad/descuento/módulo + carta en un solo paso.
- **Ruta agregada**: `solicitar-incorporacion` (sin param) para migración
- Renombrado `documento_incorporacion` → `solicitud_incorporacion`
- Nuevo campo `es_incorporacion` BOOLEAN en `detalle_programa_alumno`
- Requisito "Carta de Solicitud de Incorporación" (id=6) creado
- **Backend**: modelo `SolicitudIncorporacion`, 6 endpoints (solicitar, listar, mis-solicitudes, detalle, aprobar, rechazar)
- **Frontend**: componente `solicitar-incorporacion` (alumno, unified), `solicitudes-incorporacion` (admin), badge "Incorporación" en inscripciones, inscripcion-detail, inscripciones-edicion; `inscribir` simplificado (sin lógica de incorporación)
- **Doc-matriz bugfix**: dialog refresh — botones "Cerrar" y X ahora usan `(click)="close()"` en vez de `mat-dialog-close`, `disableClose: true` para ESC/backdrop. Parent `afterClosed()` siempre recibe el postulante actualizado.
- **Doc-matriz filter chips**: stats-bar reemplazada por chips clickeables (sin avance, en revisión, aprobados) con botón "Limpiar". `allPostulantes` signal mantiene el dataset completo, `postulantes` se filtra según `filtroEstado`.
- **Solicitudes curado**: fix IDOR en `GET /{id_solicitud}` (alumno solo ve las suyas, admin necesita `alumnos.ver`), `login.goToRegister()` ahora forward el param `?incorporar=` a registro, registros legacy con `estado='aprobado'` corregidos a `'aceptado'`, schema `SolicitudIncorporacionUpdate` eliminado (dead code), texto "arrastra tu archivo" corregido a "seleccionar tu archivo", método renombrado `getSolicitudesPendientes` → `getSolicitudesIncorporacion`, botón "Solicitudes de Incorporación" agregado al header de inscripciones-landing.
- **Subida de documentos global en dos pasos**: Todos los uploads de archivos ahora siguen el patrón select → preview/confirm → upload. Componentes afectados:
  - `inscripcion-detail`: barra de confirmación con nombre, tamaño, cancelar/confirmar. Botón "Subir carta de incorporación" para alumnos con `es_incorporacion` que necesitan subir la carta.
  - `contratacion-detalle`: barra de confirmación para subir y reemplazar PDFs de contratación.

## Hecho reciente (2026-07-25)
- Eliminación de `avance_modulo` y `nota.id_programa_version_edicion` — simplificación del modelo de datos
- Transcript movido a `routers/nota.py` (antes era `routers/avance_modulo.py`)
- Frontend: `ModuloTranscript` ya no incluye `completado_en_edicion` ni `fecha_completion`
- SQL ejecutado: `DROP TABLE avance_modulo` + `ALTER TABLE notas DROP COLUMN id_programa_version_edicion`
- Backend: 25 routers (antes 26)
- Frontend compila OK (solo warning de bundle size pre-existente)

## Historial

Para logs de sesión detallados, ver `git log --oneline` en ambos repos. Cada feature relevante tiene su commit message descriptivo.
