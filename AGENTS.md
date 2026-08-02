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
- **Frontend unificado**: `inscribir` es ahora un wizard de 3 pasos para ediciones `en_curso` (situación → formulario → documentos de incorporación). Para ediciones `programado`, formulario directo sin wizard. Componente `solicitar-incorporacion` eliminado (funcionalidad integrada en `inscribir`).
- **Ruta**: Solo `/alumnos/inscribir/:idEdicion` (eliminadas rutas `solicitar-incorporacion`)
- **Wizard persistence**: El paso actual se deriva del backend (DPA + solicitud existentes). Si el usuario sale y vuelve, retoma donde se quedó. Si la solicitud tiene todos los documentos subidos, redirige al detalle automáticamente.
- **Carta status en inscripcion-detail**: `needsCartaUpload()` verifica tanto `es_incorporacion` como la existencia de solicitud. `cartaEnRevision()`, `cartaAprobada()`, `cartaRechazada()` muestran badges de estado.
- Renombrado `documento_incorporacion` → `solicitud_incorporacion`
- Nuevo campo `es_incorporacion` BOOLEAN en `detalle_programa_alumno`
- Requisito "Carta de Solicitud de Incorporación" (id=6) creado
- **Backend**: modelo `SolicitudIncorporacion`, 7 endpoints (solicitar, listar, mis-solicitudes, detalle, aprobar, rechazar, subir-documento)
- **Frontend**: `inscribir` (wizard 3 pasos para en_curso: situación → formulario → documentos multi-upload con progress bar, formulario directo para programado), `solicitudes-incorporacion` (admin), badge "Incorporación" en inscripciones, inscripcion-detail, inscripciones-edicion
- **Doc-matriz bugfix**: dialog refresh — botones "Cerrar" y X ahora usan `(click)="close()"` en vez de `mat-dialog-close`, `disableClose: true` para ESC/backdrop. Parent `afterClosed()` siempre recibe el postulante actualizado.
- **Doc-matriz filter chips**: stats-bar reemplazada por chips clickeables (sin avance, en revisión, aprobados) con botón "Limpiar". `allPostulantes` signal mantiene el dataset completo, `postulantes` se filtra según `filtroEstado`.
- **Solicitudes curado**: fix IDOR en `GET /{id_solicitud}` (alumno solo ve las suyas, admin necesita `alumnos.ver`), `login.goToRegister()` ahora forward el param `?incorporar=` a registro, registros legacy con `estado='aprobado'` corregidos a `'aceptado'`, schema `SolicitudIncorporacionUpdate` eliminado (dead code), texto "arrastra tu archivo" corregido a "seleccionar tu archivo", método renombrado `getSolicitudesPendientes` → `getSolicitudesIncorporacion`, botón "Solicitudes de Incorporación" agregado al header de inscripciones-landing.
- **Subida de documentos global en dos pasos**: Todos los uploads de archivos ahora siguen el patrón select → preview/confirm → upload. Componentes afectados:
  - `inscripcion-detail`: barra de confirmación con nombre, tamaño, cancelar/confirmar. Botón "Subir carta" solo se muestra si no existe solicitud. Badges de estado para carta: Pendiente, Aprobada, Rechazada (con opción de re-enviar).
  - `contratacion-detalle`: barra de confirmación para subir y reemplazar PDFs de contratación.
- **solicitud_incorporacion junction table restructure**: `solicitud_documento` junction table created linking solicitud → requisito with individual doc URLs/states. `id_alumno` FK removed from `solicitud_incorporacion` (redundant — accessible via DPA). Frontend models updated: `SolicitudDocumento` interface, `SolicitudIncorporacion.documentos[]`, `SolicitudIncorporacionConDetalle.documentos[]`. Admin table shows document chips. Carda status uses `cartaDoc()` computed (last document). Backend approve/rechazar returns `SolicitudIncorporacionConDetalle`.
- **solicitud_requisito config**: Admin-configurable list of which documents are required for incorporation solicitudes. Backend: model + schema + router (`solicitud_requisito`). DB table with `id_requisito`, `obligatorio`, `estado`. Admin page at `/admin/requisitos-incorporacion`. `_crear_documentos_solicitud()` reads this config when creating solicitudes.
- **Step 3 multi-document wizard**: Rewritten to show all solicitud documents with individual uploads and progress bar. Flow: create solicitud (without file) → list docs → upload each → auto-redirect when all done. Backend: `url_documento` optional in schema, new `PATCH /{id_solicitud}/documentos/{id_doc}/subir` endpoint. Backend sync: `aprobar_solicitud` copies solicitud docs → `control_documentacion` to avoid duplicate uploads.

## Hecho reciente (2026-07-25)
- Eliminación de `avance_modulo` y `nota.id_programa_version_edicion` — simplificación del modelo de datos
- Transcript movido a `routers/nota.py` (antes era `routers/avance_modulo.py`)
- Frontend: `ModuloTranscript` ya no incluye `completado_en_edicion` ni `fecha_completion`
- SQL ejecutado: `DROP TABLE avance_modulo` + `ALTER TABLE notas DROP COLUMN id_programa_version_edicion`
- Backend: 25 routers (antes 26)
- Frontend compila OK (solo warning de bundle size pre-existente)

## Hecho reciente (2026-07-26) — historial_inscripcion + revisión de incorporación

### `historial_inscripcion` como columna vertebral del journey
- **SQL**: `ALTER TABLE historial_inscripcion ADD COLUMN tipo_movimiento VARCHAR(20) NOT NULL DEFAULT 'transferencia'`
- **Modelo**: `HistorialInscripcion.tipo_movimiento` (String(20), default='transferencia')
- **Schema**: `tipo_movimiento` agregado a `HistorialInscripcionCreate`, `HistorialInscripcionResponse`, `HistorialInscripcionConDetalle`
- **Transferencia** (`POST /{id}/transferir`): crea `HistorialInscripcion(tipo_movimiento='transferencia')`
- **Incorporación** (`PATCH /{id}/aprobar` en solicitud_incorporacion): crea `HistorialInscripcion(tipo_movimiento='incorporacion')` cuando hay DPA origen en mismo programa
- **Endpoint preview**: `GET /solicitud-incorporacion/{id}/preview-migracion?id_programa_version_edicion=X&id_modalidad_academica=Y` retorna comparativa origen vs destino (notas, pagos, módulos, match por nombre)
- **Schema preview**: `PreviewMigracionResponse` con `alumno`, `origen` (notas + pagos), `destino` (módulos + match), `resumen`
- **Transcript enriquecido**: `ModuloTranscriptItem` ahora incluye `es_migrada`, `edicion_origen_numero`, `edicion_origen_anio`, `edicion_origen_semestre`. El endpoint `GET /transcript/{id_alumno}` merge notas del DPA origen cuando existe `historial_inscripcion` apuntando al DPA destino, match por nombre de módulo

### Página dedicada de revisión (reemplaza dialog)
- **Nueva ruta**: `/admin/solicitudes-incorporacion/:idSolicitud/revisar`
- **Componente**: `RevisarIncorporacionComponent` con 3 secciones:
  1. Datos del alumno + documentos (cards)
  2. Configuración de migración (dropdown edición destino, modalidad, textarea motivo)
  3. Preview de migración (comparativa visual origen vs destino con notas/pagos/módulos)
- **Tabla admin**: `abrirDetalle()` ahora navega a la página en vez de abrir dialog
- **Service**: `aprobarSolicitud(id, data?)` ahora acepta data opcional con `id_programa_version_edicion`, `id_modalidad_academica`, `motivo`; nuevo método `previewMigracion(idSolicitud, idEdicion, idModalidad)`
- **Modelos frontend**: `PreviewMigracion`, `PreviewOrigen`, `PreviewDestino`, `NotaPreviewItem`, `PagoPreviewItem`, `ModuloDestinoItem` en `solicitud-incorporacion.model.ts`; `ModuloTranscript` actualizado con `es_migrada`, `edicion_origen_*`
- **Transcript**: notas migradas muestran fondo ambar sutil + punto naranja indicador + tooltip con info de edición origen

### Archivos tocados Backend
- `models/historial_inscripcion.py` — nueva columna `tipo_movimiento`
- `schemas/historial_inscripcion.py` — `tipo_movimiento` en 3 schemas
- `schemas/solicitud_incorporacion.py` — `motivo` en `AprobarSolicitudRequest`, nuevos schemas `PreviewMigracionResponse` y sub-schemas
- `schemas/nota.py` — `es_migrada`, `edicion_origen_*` en `ModuloTranscriptItem`
- `routers/detalle_programa_alumno.py` — `tipo_movimiento='transferencia'` en `transferir()`, `tipo_movimiento` en respuesta de `historial_transferencias`
- `routers/solicitud_incorporacion.py` — `aprobar_solicitud` crea `HistorialInscripcion(tipo_movimiento='incorporacion')` en migración; nuevo endpoint `preview-migracion`
- `routers/nota.py` — `transcript_alumno` merge notas migradas desde DPA origen vía `historial_inscripcion`

### Archivos tocados Frontend
- `features/inscripciones/models/inscripcion-edicion.model.ts` — `ModuloTranscript` con `es_migrada`, `edicion_origen_*`
- `features/alumno/models/solicitud-incorporacion.model.ts` — nuevos interfaces `PreviewMigracion`, `NotaPreviewItem`, `PagoPreviewItem`, `ModuloDestinoItem`, `PreviewOrigen`, `PreviewDestino`
- `features/notas/models/nota.model.ts` — `HistorialTransferencia` con `tipo_movimiento`
- `features/inscripciones/services/inscripcion-edicion.service.ts` — `aprobarSolicitud(id, data?)`, `previewMigracion()`
- `features/inscripciones/pages/revisar-incorporacion/` — NUEVO componente completo (ts + html + css)
- `features/admin/routes/admin.routes.ts` — nueva ruta `solicitudes-incorporacion/:idSolicitud/revisar`
- `features/inscripciones/pages/solicitudes-incorporacion/solicitudes-incorporacion.ts` — `abrirDetalle()` navega a página
- `features/transcript/pages/transcript/transcript.ts` — tooltip enriquecido para notas migradas
- `features/transcript/pages/transcript/transcript.html` — `.nota-migrada` + `.migrated-dot` en grade cells
- `features/transcript/pages/transcript/transcript.css` — estilos `.nota-migrada` (fondo ambar) y `.migrated-dot` (punto naranja)

## Hecho reciente (2026-07-29) — Model consistency fixes

### A.1 — `solicitud_requisito.tipo VARCHAR` → `id_tipo_solicitud FK`
- **Migration**: `005_solicitud_requisito_id_tipo_fk.sql` — adds FK column, populates from `tipo_solicitud`, drops `tipo`
- **Model `solicitud_requisito.py`**: `tipo` → `id_tipo_solicitud FK`, added `tipo_solicitud` relationship
- **Schema `solicitud_requisito.py`**: `tipo` → `id_tipo_solicitud`, added `tipo_codigo` (derived via join)
- **Router `solicitud_requisito.py`**: GET/POST use `id_tipo_solicitud` instead of `tipo` string, added TipoSolicitud import/batch query
- **Router `solicitud.py`**: `_crear_documentos()` and `_sincronizar_documentos()` accept `id_tipo_solicitud` instead of string; all callers updated

### A.1.b — Tab Migración
- **gestionar-requisitos-incorporacion.ts**: Added third tab "Migración" (`swap_horiz` icon) alongside Incorporación/Reincorporación. Tabs rendered via `@for` loop. `tipo` signal changed from string union to `number`.

### C.3 — `documento_solicitud.fecha_entrega` nullable
- **Migration**: `ALTER TABLE documento_solicitud ALTER COLUMN fecha_entrega DROP NOT NULL, DROP DEFAULT`
- **Model `documento_solicitud.py`**: `fecha_entrega` nullable, no `server_default`

### C.4 — Estado intermedio "entregado"
- **Router `solicitud.py` `subir_documento()`**: sets `doc.estado = "entregado"` on upload
- **Router `solicitud.py` `rechazar()`**: covers both `"pendiente"` and `"entregado"` states

### Frontend alignment
- **`solicitud-requisito.model.ts`**: `tipo` → `id_tipo_solicitud: number`, added `tipo_codigo: string | null`
- **`solicitud-requisito.service.ts`**: `tipo: string` → `idTipoSolicitud: number` in both `getRequisitosConfigurados()` and `agregarRequisito()`
- **`gestionar-requisitos-incorporacion.ts`**: `tipo` signal → `signal<number>(1)`, `TIPOS` const with id/codigo/label/icon, `tipoLabelMap` for display labels, template dynamic tabs via `@for`

### Archivos tocados Backend
- `migrations/005_solicitud_requisito_id_tipo_fk.sql` — NUEVA migration
- `models/solicitud_requisito.py` — `tipo` → `id_tipo_solicitud FK`
- `models/documento_solicitud.py` — `fecha_entrega` nullable
- `schemas/solicitud_requisito.py` — `tipo` → `id_tipo_solicitud`
- `routers/solicitud_requisito.py` — `tipo` → `id_tipo_solicitud` en GET/POST
- `routers/solicitud.py` — `_crear_documentos`/`_sincronizar_documentos` signature, subir_documento (estado="entregado"), rechazar (cubre entregado)

### Archivos tocados Frontend
- `features/inscripciones/models/solicitud-requisito.model.ts` — `tipo` → `id_tipo_solicitud`
- `features/inscripciones/services/solicitud-requisito.service.ts` — `tipo` → `idTipoSolicitud`
- `features/inscripciones/pages/gestionar-requisitos-incorporacion/gestionar-requisitos-incorporacion.ts` — tabs dinámicos + número

## Hecho reciente (2026-07-31) — Inscripciones por edición estilo "menú de solicitudes"

- **Página `inscripciones-edicion`** migrada de paginación/filtrado server-side a **client-side completo** (espejo del patrón `solicitudes-incorporacion`):
  - Un solo request `getPorEdicion(idEdicion, 1, 500)` carga todo; `allItems` guarda el dataset completo, `items` es el resultado filtrado
  - Stats-row con **chips clickeables por estado** (postulantes/observados/inscritos/incorporados/finalizados/graduados/retirados) con conteos vía `countPorEstado()` computed; click togglea el filtro, botón "Limpiar" aparece con filtros activos
  - Búsqueda client-side (nombre, apellido, CI, correo) sin debounce — reemplaza al `mat-select` de estado (eliminado junto con `MatSelectModule` y `.estado-field`)
  - Paginador custom estilo solicitudes: `paginator-info` (rango), controles anterior/siguiente + números, y selector "N por pág." (`perPageOptions = [10, 20, 50, 100]`), page 0-based
- **Backend**: límite `per_page` subido `le=100` → `le=500` en `routers/detalle_programa_alumno.py` (único consumidor de `por-edicion` es esta página)
- Métodos eliminados: `irAPagina`, `paginasVisibles`, `onFiltroEstado` (server-side), `busquedaTimeout`; agregados: `aplicarFiltros`, `limpiarFiltros`, `nextPage`, `prevPage`, `cambiarPerPage`, `chipClass`, `estadoIcon`
- Estados chips usan colores propios (`chip-postulante` azul, `chip-observado` rojo, `chip-inscrito` verde, `chip-incorporado` ámbar, `chip-finalizado` índigo, `chip-graduado` esmeralda oscuro, `chip-retirado` gris)
- Frontend verificado con `npx tsc --noEmit` limpio

## Hecho reciente (2026-08-01) — Refactor de inscripcion-detail (página del alumno)

- **Stepper "caminito de serpiente" → hitos horizontales** en la card "Tu recorrido en el programa":
  - `ESTADO_HITOS` (5 hitos: Postulación → Admisión → Incorporación → Finalización → Egreso) con icono + descripción. El hito "Incorporación" se filtra si `!es_incorporacion`
  - El hito "Admisión" ahora arranca en `inscrito` (no `observado`) — "Observado" ya NO es etapa superable del camino, se muestra como aviso aparte (tarjeta ámbar "Tus documentos fueron observados") al igual que "Retirado" (tarjeta roja)
  - `hitos()` computed: `completado`/`actual`/`pendiente` por índice; retirado marca todo pendiente
  - CSS: `.hitos`, `.hito`, `.hito-linea` (conector con `.filled`), `.estado-aviso` (variantes `.observado`/`.retirado`)
- **Info card lateral "Tu inscripción" enriquecida** (`.info-card-header` con `.info-avatar` + `.edicion-estado-badge`):
  - Badge de estado de la edición (`programado`/`en_curso`/`reprogramado`/`finalizado` con `EDICION_ESTADO_LABELS`/`EDICION_ESTADO_COLORS`)
  - Filas: edición, periodo (`rangoFechas()` computed con `fecha_inicio`/`fecha_fin`), modalidad, módulo de inicio, fecha de inscripción, tipo (incorporación), descuento, inversión (Bs)
- **Zona de peligro estilo GitHub** al final de la página (full-width): header rojo con warning + body con texto y botón "Retirarse de esta inscripción". Solo si `puedeRetirarse()` (no retirado/finalizado/graduado). CSS `.danger-zone*`, `.retirar-btn`
- **Lógica migración/reincorporación contextual** (reglas de negocio acordadas):
  - `edicionActiva()` = `en_curso` | `reprogramado`. Retirado + edición activa → card reincorporación (`mostrarReincorporacion`)
  - Retirado + edición finalizada → card migración (texto distinto en `textoMigracion()`)
  - Edición finalizada sin retiro → card migración normal
  - Edición en curso sin retiro → NO se muestra nada de migración (eliminada la card gris "Migración no disponible" y sus estilos `.migracion-card.disabled`)
  - `puedeMigrar` señal (backend) decide `showMigracionCard()`; `motivoMigrar` señal eliminada (muerto)
- **Bugfix "Volver a solicitar"**: cuando una solicitud estaba rechazada, el botón abría el form pero la card quedaba oculta. Ahora `mostrarReincorporacion()` acepta `showMotivoForm()` y `showMigracionCard()` acepta `showMigracionForm()`; la card rechazada se oculta mientras el form está abierto (`tieneSolicitudRechazada() && !showMotivoForm()`, `showMigracionRechazada() && !showMigracionForm()`)
- **Reincorporación unificada en un solo apartado (2026-08-01)**: eliminada la "tarjetita" de solicitar que separaba el envío del motivo de la subida de documentos. Ahora:
  - Un apartado grande `.reincorporacion-apartado` en la main-col (justo debajo de la card de recorrido) con header, textarea de motivo y la **lista de documentos requeridos** (configurados por admin para el tipo `reincorporacion`) con selección de archivo individual (chip con nombre + quitar). Un único botón "Enviar solicitud" crea la solicitud y sube todos los archivos en secuencia.
  - **El apartado es un desplegable** (patrón contratación docente): el header es clickeable (con chevron `expand_more` rotativo), el contenido (motivo + docs + botón) está en `@if (reincorporacionExpandida())`. Se abre por defecto en su primera aparición; `solicitarReincorporacion()` (botón "Volver a solicitar") lo reabre con `reincorporacionExpandida.set(true)`.
  - Señales nuevas: `requisitosReincorporacion` (SolicitudRequisito[]), `reincReqFiles` (Record<id_requisito, {file,name,size}>), `reincorporacionExpandida` (boolean), computed `reincReqSubidos()`. Métodos: `onReincReqFileSelected(event, idRequisito)`, `quitarReincReqFile(idRequisito)`, `_subirReincReqFiles(sol)` (sube en secuencia mapeando `id_requisito` → `id_solicitud_documento`).
  - Los estados pendiente/rechazada + card de docs de reincorporación se **movieron de la side-col a la main-col** (después del apartado) para que todo el flujo viva junto. Side-col queda solo con info-card y migración.
  - `showMotivoForm` y `cancelarReincorporacion` eliminados (el apartado es persistente, no tiene estado cerrado). `solicitarReincorporacion()` ahora limpia la solicitud rechazada para reabrir el apartado.
- **Backend**: `GET /solicitud-requisitos/` relajado de `require_permiso("alumnos.editar")` a `Depends(get_current_user)` para que el alumno pueda consultar los requisitos configurados de reincorporación (solo lectura; POST/PATCH siguen admin-only).

## Bugfixes admin de solicitudes (2026-08-01)

- **"Solicitud sin programa" en reincorporación**: `_load_con_detalle()` (backend) solo derivaba la edición/programa desde `incorporacion`/`migracion`. Para reincorporación la edición vive en el DPA origen retirado → ahora el DPA origen se carga primero y su `id_programa_version_edicion` se suma a `pve_ids`; si `_pve_from_solicitud()` no da edición, se usa la del DPA. El listado admin ya muestra programa + edición para reincorporaciones.
- **Página de revisión distinguía solo migración**: para reincorporación caía en el bloque genérico "Primera Incorporación... se creará como postulante". Ahora hay un bloque propio `.info-reincorporacion` (azul índigo): "el alumno ya tenía inscripción y se retiró; al aprobar se reactiva como **inscrito** en la misma edición, conservando notas, pagos y documentos". Título del header dinámico según tipo.
- **Historial del alumno en la página de revisión**: nueva card `.historial-card` con inscripciones (badges por estado, resaltada la que corresponde al `id_detalle_origen` de la solicitud) y movimientos (`historial-movimientos` endpoint). Se carga vía `InscripcionEdicionService.getHistorialMovimientos(idAlumno)`.
- **Tabla de solicitudes**: `.estado-actions` ahora es `flex-direction: column` (badge pendiente arriba, botones aprobar/rechazar debajo) para que no se solapen; `col-estado` ancho 150px.
- **Aprobar reincorporación conserva módulo de inicio**: antes `resolver_modulo_inicio()` se llamaba siempre y reasignaba `dpa.modulo_inicio` al primer módulo. Ahora solo se reasigna si el admin envía `id_modulo_inicio`; si no, el alumno vuelve al módulo donde quedó.
- Frontend verificado con `npx tsc --noEmit` limpio

## Anchado de páginas (2026-08-01)

- Se subió el `max-width` de los contenedores principales de ~46 archivos CSS para aprovechar el ancho de pantalla y eliminar el exceso de espacio en blanco lateral. Mapeo aplicado (solo la primera ocurrencia = contenedor de página; NO se tocaron filtros/búsquedas/diálogos/login/`.search-field` de 880px):
  - `1300/1320px → 1560px`: docente-list, programa-list, tipo-programa-list, programa-version-list, contratacion-list, footer
  - `1200px → 1440px`: home, inscripcion-edicion, inscripcion-landing, revisar-incorporacion, solicitudes-incorporacion, notas-admin, notas-edicion, pagos-admin, pagos-edicion
  - `1100px → 1340px`: admin-wrapper, inscripcion-detail, docente-calificar, docente-detalle, docente-mis-modulos, documentacion, modalidad-list, modulo-list, requisitos-list, tipo-descuento-list, transcript, requisito-detail
  - `1000px → 1240px`: edicion-postulantes
  - `960px → 1200px`: contratacion-detalle
  - `920px → 1160px`: detalle-list, contratacion-create
  - `900px → 1160px`: edicion-list
  - `860px → 1100px`: inscribir, detalle-gestionar
  - `820px → 1040px`: modulo-batch
  - `800px → 1040px`: inscripciones, perfil, detalle-form, historial-page, historial-edicion-page
  - `640px → 840px`: programa-version-form, modalidad-detail, requisito-detail
  - `680px → 880px`: tipo-programa-form, programa-form, docente-form
  - `720px → 920px`: edicion-form, modulo-form
- `styles.css` `.form-card` global: `680px → 880px`
- Grids con columna lateral fija (`1fr 320px` en inscripcion-detail, `380px 1fr` en revisar-incorporacion) escalan bien: la columna principal crece con el contenedor.
- Frontend verificado con `npx tsc --noEmit` limpio

## Segunda ronda de anchado — "todo el ancho" (2026-08-02)

- Tras la primera ronda, Julio pidió aprovechar **todo** el ancho. Nueva ronda aplicada (misma técnica: solo la primera ocurrencia = contenedor de página; NO se tocaron filtros/búsquedas/diálogos/inputs internos ni `@media`):
  - Listas/detalles/dashboards → **1920px**: docente-list, programa-list, programa-version-list, tipo-programa-list, contratacion-list, home, notas-admin, notas-edicion, pagos-admin, pagos-edicion, inscripcion-edicion, inscripcion-landing, revisar-incorporacion, solicitudes-incorporacion, admin-wrapper, docente-calificar, docente-detalle, docente-mis-modulos, documentacion, inscripcion-detail, modalidad-list, modulo-list, requisitos-list, tipo-descuento-list, transcript, footer
  - Formularios/páginas de gestión → **1240-1440px**: contratacion-create (1440), edicion-list (1440), detalle-list (1440), detalle-gestionar (1360), inscribir (1360), detalle-form (1280), historial-page (1280), historial-edicion-page (1280), inscripciones (1280), modulo-batch (1280), perfil (1280), edicion-form (1240), modulo-form (1240), docente-form (1240), programa-form (1240), tipo-programa-form (1240), programa-version-form (1240), modalidad-detail (1240), requisito-detail (1240)
  - `styles.css` `.form-card` global: `880px → 1240px`
  - **No tocada** `public-home` (landing pública): sus secciones internas (680-1100px) son centradas a propósito.
- Frontend verificado con `npx tsc --noEmit` limpio

## Ajuste final del anchado — 10% de aire (2026-08-02)

- 1920px era demasiado (quedaba pegado al borde). Se agregó `width: 90%` a los contenedores de página (todos los de la ronda anterior, 45 archivos + `.form-card` global): ahora el contenido ocupa el 90% del ancho del viewport y deja ~10% de aire, con el `max-width` como tope en pantallas ultra-anchas.
- Técnica: primera ocurrencia de `max-width:` en cada archivo → prefijada con `width: 90%; `. NO se tocaron `@media`, filtros ni elementos internos. Con `box-sizing: border-box` global el padding queda dentro del 90%.
- Frontend verificado con `npx tsc --noEmit` limpio

## Ordenamiento de tablas de estudiantes (2026-08-01)

- Nueva utilidad `core/utils/sort-utils.ts`: `SortDir`, `compareValues()` (null-safe, numérico o `localeCompare('es')`), `sortItems(items, keyAccessor, dir)` — devuelve copia ordenada sin mutar.
- **Tablas con cabeceras clickeables** (patrón `sortKey`+`sortDir` signal, `onSort()` toggle asc/desc, `sortIcon()` → `unfold_more`/`arrow_upward`/`arrow_downward`, `.sort-btn` en el `<th>`):
  - `inscripciones-edicion` — columnas: alumno (apellido+nombre), CI, estado, modalidad, docs (ratio completados/total), módulo inicio, descuento. `sortedItems` computed alimenta `paginatedItems`.
  - `solicitudes-incorporacion` — columnas: alumno, tipo de solicitud, docs subidos, estado. Default orden por fecha desc.
- **Cards (notas/pagos/docente) con toggle de orden alfabético A-Z/Z-A** (`nombreDir` signal + `sort-toggle` button en el header, patrón `alumnosOrdenados`/`sortAlumnos` computed con `sortItems` por `apellido nombre`):
  - `notas-edicion` (activos + retirados)
  - `pagos-edicion`
  - `docente-calificar`
- Frontend verificado con `npx tsc --noEmit` limpio

## Bugfix: menú Documentos Requeridos vacío (2026-08-02)

- **Síntoma**: `/admin/requisitos-incorporacion` no mostraba nada en ningún tab (Incorporación/Migración/Reincorporación), aunque la tabla `solicitud_requisito` tenía filas activas.
- **Causa raíz**: `routers/solicitud_requisito.py::listar_requisitos` construía `SolicitudRequisitoResponse(obligatorio=i.obligatorio, ...)` pero la columna `obligatorio` fue eliminada del modelo y la BD en la migración `005_solicitud_requisito_id_tipo_fk.sql` (que convirtió `tipo` → `id_tipo_solicitud` FK). El acceso a un atributo inexistente del modelo → `AttributeError` → HTTP 500 → el frontend caía en el `error()` y quedaba el estado vacío.
- **Fix**: eliminado el kwarg `obligatorio=i.obligatorio` del response builder en `listar_requisitos`. No existe `obligatorio` en `SolicitudRequisito` (los docs obligatorios son concepto de `documento_solicitud`/`control_documentacion`, no de `solicitud_requisito`).
- **Verificación**: `GET /solicitud-requisitos/?id_tipo_solicitud={1,2,3}` responde 200 con las configs activas; `POST` para agregar requisito responde 201.
- Archivos tocados: `PostgradoBackend/routers/solicitud_requisito.py` (1 línea).

## Bugfix: solicitudes aprobadas mostraban el formulario de reincorporación (2026-08-02)

- **Síntoma**: un alumno con solicitud de reincorporación ya `aprobado` seguía viendo el formulario de reincorporación y los requisitos configurados (config actual del admin) en `inscripcion-detail`, en vez de ver su solicitud aprobada con sus documentos reales.
- **Regla de negocio fijada**: los requisitos configurados por el admin (`solicitud_requisito`, `modalidad_requisito`, etc.) solo aplican a **creaciones futuras**. Los registros pasados (solicitudes, `documento_solicitud`, `control_documentacion`) nunca se resincronizan contra la config actual. Cambiar la config del admin NO debe alterar solicitudes/inscripciones ya existentes.
- **Causa raíz**: `mostrarReincorporacion()` (frontend) solo excluía `pendiente` y `rechazado` — `aprobado` caía en el formulario. Además el backend sincronizaba requisitos nuevos sobre solicitudes existentes.
- **Backend** (`PostgradoBackend/routers/solicitud.py`): eliminada la función `_sincronizar_documentos()` y sus 2 llamadas en `_load_con_detalle()` y `mis_solicitudes()`. Ahora `_crear_documentos()` (se ejecuta al crear la solicitud) es el único generador de `DocumentoSolicitud` → futuros-only. Imports `DocumentoSolicitud`/`SolicitudRequisito` siguen en uso.
- **Frontend** (`inscripcion-detail`):
  - TS: `mostrarReincorporacion()` ahora también excluye `&& !this.tieneSolicitudAprobada()`; nuevo método `tieneSolicitudAprobada()` (`estado === 'aprobado'`).
  - HTML: nuevo bloque `@if (tieneSolicitudAprobada())` antes de `needsCartaUpload()` — card `.reincorporacion-card.aprobada` (verde) + lista de docs con `reincDocs()` (usa los `documentos` reales de la solicitud, no la config) con estados `aceptado`/`pendiente`, badge `doc-approved-badge`, enlace `getDocUrl`.
  - CSS: variantes `.reincorporacion-card.aprobada` (border #bbf7d0, bg #f0fdf4, h3 #166534, p #16a34a).
- **Verificación**: `GET /solicitud/mis-solicitudes` y `GET /solicitud/{id}` con alumno 2 (usuario 6, solicitudes 1014/1001 `aprobado`) devuelven solo sus documentos reales (solicitud 1014 → solo requisito 7 "Carta de Solicitud de Reincorporación", estado `aceptado`); no se agregan los requisitos configurados (6, 9, 10). `npx tsc --noEmit` limpio.
- Archivos tocados: `PostgradoBackend/routers/solicitud.py`, `inscripcion-detail.ts`, `inscripcion-detail.html`, `inscripcion-detail.css`.

## Rediseño de revisar-incorporacion + bugfix historial/motivo (2026-08-02)

- **Bugfix historial**: `GET /detalle-programa-alumno/historial-movimientos/{id}` daba 500 — `NameError: name 'ProgramaVersion' is not defined` en `routers/detalle_programa_alumno.py` (faltaba el import `from models.programa_version import ProgramaVersion`). Con eso el historial del alumno (inscripciones + movimientos) ya se carga en la página de revisión.
- **Bugfix motivo del alumno**: el motivo que escribe el alumno (columna `solicitud.motivo`) ya viajaba en la API (`SolicitudConDetalle.motivo`) pero **no se renderizaba** en el HTML. Ahora se muestra en una tarjeta de cita (`.motivo-card`, ámbar).
- **Rediseño completo de la página** (reemplaza el header plano + alumno-card por una composición más visual):
  - `.page-toolbar` — toolbar simple con botón volver + título (sin el icono en el h1).
  - `.hero-card` — banner full-width con gradiente según tipo (reincorporación = índigo/violeta, migración = teal, incorporación = azul), avatar grande con iniciales, eyebrow del tipo, nombre, chips (CI, programa, edición) y `.estado-pill` blanco flotante con icono.
  - `.motivo-card` — cita del motivo del alumno (`format_quote` ámbar).
  - `.stats-strip` — 3 stat-cards: documentos subidos x/y, inscripciones previas, movimientos.
  - `.timeline` — movimientos del historial como línea de tiempo vertical con dots de color por `tipo_movimiento` (reincorporacion/incorporacion/migracion/transferencia), badge "último" (`esUltimoMovimiento()`), fecha, edición y motivo del movimiento.
  - Inscripciones del historial con `.ins-marker` (dot de color por estado) + resaltado de la inscripción que corresponde al `id_detalle_origen`.
- Eliminadas clases obsoletas del CSS: `.alumno-card/.alumno-header/.avatar-lg/.meta-chip/.programa-info`, `.historial-mov-row/.mov-icon/.mov-info`.
- Archivos tocados: `PostgradoBackend/routers/detalle_programa_alumno.py` (import), `revisar-incorporacion.html`, `revisar-incorporacion.css`.

## Config de entornos: Postgres local + Supabase (2026-08-02)

- **Dos entornos vía una sola variable `DATABASE_URL`** (leída en `database.py:8`). El código no cambia entre entornos, solo el valor de la URL.
- **Selección por `APP_ENV`**:
  - `APP_ENV` no definida (o `local`) → carga `.env` → Postgres local (`julius:adminjt@localhost/postgrado`)
  - `APP_ENV=production` → carga `.env.prod` → Supabase
- `database.py`:
  ```python
  ENV = os.getenv("APP_ENV", "local")
  load_dotenv(".env.prod" if ENV == "production" else ".env")
  ```
- **`.env.prod`** (gitignoreado, igual que `.env`):
  - `DATABASE_URL=postgresql://postgres.fdrxfohyhzvlpxnhorva:J2AhZ_dtiSguJLX@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`
  - Usa puerto **5432** (session pooler), NO el 6543 (transaction pooler, para serverless) que viene por defecto en el enlace de Supabase. Requiere `?sslmode=require` para TLS con psycopg2.
- **Para arrancar contra Supabase**: `APP_ENV=production` antes de `uvicorn`. Contra local: nada.
- **Estado actual**: servidor corriendo contra Supabase (verificado — solicitud 1014 aparece `pendiente` en Supabase vs `aprobado` en local). Supabase ya tiene las 37 tablas con datos (35 alumnos, 18 solicitudes).
- `.gitignore`: agregado `.env.prod`.

## Historial

Para logs de sesión detallados, ver `git log --oneline` en ambos repos. Cada feature relevante tiene su commit message descriptivo.