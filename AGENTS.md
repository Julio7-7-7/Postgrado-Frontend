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

- **Refinar contraste y diferenciación visual general**
- **Subida de documentos por parte del alumno** — funcionalidad completa (subir archivo al servidor, no solo ver requisitos)
- **Matriz visual rol × permiso** (opcional, postergable)

## Botón "Cambiar de rol" en el menú de usuario (2026-08-07, SIN commit)

- **Pedido de Julio**: un botón **"Cambiar de rol"** sobre "Cerrar sesión" en el menú de usuario del navbar que vaya **directo al selector de rol sin pedir password**.
- **Flujo**: `navbar` → botón `swap_horiz` "Cambiar de rol" (solo visible si `hasMultipleRoles()`, i.e. `auth.roles().length > 1`) → `router.navigate(['/login'], { queryParams: { cambiar: '1' } })`.
- **`login.ts`**: `ngOnInit` lee `queryParams['cambiar'] === '1'` (campo nuevo `cambiarRol`). Si hay sesión logueada y el flag está activo → precarga `userRoles` con `auth.roles()` y `loginUserId` con el `id_usuario` del usuario actual y salta directo a `step='roles'` (el selector existente). Sin volver a pedir credenciales; `seleccionarRol()` sigue consumiendo `POST /auth/seleccionar-rol` (id_usuario + id_rol, sin password).
- **`volver()`**: en modo cambiar rol navega a `/` en vez de volver al paso de credenciales.
- Archivos tocados: `shared/components/navbar/navbar.ts|html`, `features/login/pages/login.ts`. Verificación: `npx tsc --noEmit` limpio.

## Notas-admin: matriz "Excel" con zebra por columna + fotos en la landing (2026-08-07, SIN commit)- **Matriz de notas estilo Excel** (`notas-edicion`): columna Alumno fija a la izquierda (blanca, separada con borde derecho 1px, nombre en formato **"Apellido Nombre" sin coma**), columnas 1-6 con **zebra por columna de módulo** — módulos impares (1,3,5) fondo celestito `#ecfeff`, pares (2,4,6) blanco — y columna Prom con gris sutil `#f8fafc`. **Sin líneas separadoras** entre celdas (`border-bottom`/`border-right` 0px en todas las celdas de módulo y prom).
- **Header de cada columna de módulo con tooltip** que muestra "Módulo N — <nombre del módulo>" (`.mat-mdc-tooltip-trigger` en `<th>`, `getTooltip(header)`). Orden visual de columnas: Alumno, 1..6, Prom.
- **Hover** oscurece apenas el tinte de la columna (`--fich-primary` con alpha bajo) sin romper la zebra.
- **Filas retiradas** (toggle "Retirados") con fondo gris y clase `.row-retirado`; el toggle se mantiene.
- **Fotos en la landing de notas-admin** (`notas-admin`): las cards de ediciones mostraban placeholder `grading` en vez de la foto de la edición (usaban `card-icon`/icono). Ahora cada card muestra `<img>` con la foto real del programa versión edición vía `getFotoUrl()`; si no hay foto, placeholder. Verificado por render real (Playwright/Chromium, login admin `adminjt`): 4 cards con `<img>` renderizado (160px de alto, src `http://localhost:8000/media/versiones/...jpeg`), 0 placeholders.
- **Bugfix de compilación**: `private alumnos` en `notas-edicion.ts` rompía el template compiler (TS2341, "Property 'alumnos' is private...") → se quitó el `private`. Además se limpiaron los warnings NG8011 de `register.html` (icono de `mat-raised-button` dentro de `@if/@else` con múltiples nodos raíz → envuelto en `<ng-container>`).
- Archivos tocados: `notas-edicion.ts|html|css`, `notas-admin.ts|html|css`, `register.html`. Verificación: `npx tsc --noEmit` limpio + render Playwright real.

### REDISEÑO: "Tablero de notas" — el estilo cebra fue rechazado (2026-08-07, SIN commit)

- **Pedido de Julio**: "no me gusta el estilo cebra. te doy libre para que diseñes la tabla de forma más bonita y creativa. sé original".
- **Nueva composición** (`notas-edicion.html/css` reescritos, sin rejilla ni zebra):
  - Contenedor `.matriz-scroll` como tablero: radius 18px, gradiente vertical sutil + resplandor radial morado tenue arriba, `--fich-shadow-sm`.
  - **Cabeceras como píldoras**: cada módulo es un círculo morado `.th-num` (bg `--fich-feature-notas-light` #faf5ff, borde #f3e8ff, texto #9333ea, escala al hover); "Prom" es una píldora `.th-prom-chip` rellena con gradiente púrpura (#a855f7→#7c3aed) y texto blanco. Tooltips intactos.
  - **Burbujas de nota** `.nota-bubble`: píldoras tintadas por clasificación (abandono gris, insuficiente #fef2f2/#b91c1c, suficiente #fffbeb/#b45309, bueno #eff6ff/#0369a1, distinguido #ecfdf5/#047857, sobresaliente #eef2ff/#4338ca); sin nota → píldora hueca con borde punteado "—". Al hover de fila, la burbuja escala 1.08 y toma borde de su color.
  - **Promedio como anillo de progreso** `.prom-ring`: donut CSS puro (conic-gradient con `--prom-color` por clasificación + agujero blanco vía `::before`), número centrado. `promBg()` devuelve el conic; `promedioClass()` aporta el color vía `--prom-color`.
  - **Avatar de iniciales** `.alumno-avatar` (círculo morado con iniciales de apellido+nombre, `initials()`) al lado del nombre/CI en la columna Alumno sticky (z-index 1, desvanecido derecho con gradiente `::after` en vez de borde).
  - **Meta row** `.matriz-meta-row`: "6 módulos · 7 alumnos" + **leyenda de clasificación** (`.matriz-leyenda` con `.leyenda-dot` de cada color). Hover de fila = tinte `--fich-bg-subtle` uniforme (sin líneas separadoras).
  - **Retirados**: filas atenuadas (opacity .55), burbujas desaturadas (`saturate(0.2)`), avatar gris y nombre con tachado (`line-through`) al expandir el toggle.
  - `cal-*` ahora son tintes de fondo+borde+color (antes solo color); siguen siendo válidos los de `clasificarNota()`.
- Verificación: `npx tsc --noEmit` limpio + render Playwright real (ed 2): 42 burbujas (25 vacías), 7 anillos con conic correcto (78/86/80/81/79/98/96), 7 avatares, leyenda, `td.col-alumno` sticky left 0, `.th-num` bg #faf5ff.

### Pulido 2: cabecera de dos niveles "Número de módulo" (2026-08-07, SIN commit)

- **Pedido de Julio**: "me encanta ese concepto de píldoras y burbujas. estilizalo un poco más y aparte añade una fila más que diga número de módulo y en esa fila van los números de módulo y recién abajo lo de nombre de estudiantes".
- **Cabecera agrupada de 2 filas** (thead): fila `.thead-group` con "Alumno" (icono `person_outline` + label, `rowspan=2`, sticky left) + label **"Número de módulo"** (`colspan = modulos().length`, `.th-mod-group` con líneas decorativas a ambos lados vía `.th-mod-group-line` gradiente, uppercase letter-spacing) + "Prom" (`rowspan=2`). Fila `.thead-nums` con los 6 círculos morados y tooltip por módulo. Hairline `border-bottom` de 1px bajo toda la cabecera. Los nombres de estudiantes quedan debajo en las filas del body (sin cambios).
- **Pulido extra**: `font-variant-numeric: tabular-nums` en `.nota-bubble` y `.prom-num`; highlight interior (`inset 0 1px 0 rgba(255,255,255,.55)`) en burbujas y círculos de módulo; `.thead-group` con banda `linear-gradient(180deg,#fbfaff,transparent)`; `th.col-mod` min-width 68px para alinear con las celdas.
- Verificación: `npx tsc --noEmit` limpio + render Playwright real (ed 2): grupo "NÚMERO DE MÓDULO" colspan 6, números 1-6, Alumno rowspan 2 sticky, Prom rowspan 2, 8 columnas, primera fila "Flores Aparicio Maria Cristina", hairline 1px.

### Pulido 3: columna Alumno acotada, hairline entre filas, hover de fila completa (2026-08-07, SIN commit)

- **Pedido de Julio**: "esa separación entre el nombre y las notas que no sea demasiado larga. un poco más corta; que se sienta la delimitación entre fila y fila; al posarse se pinte toda la fila, no solo el lado de las notas".
- **Columna Alumno acotada a 250px** (`width/max-width: 250px` en `th.col-alumno` y `td.col-alumno`): antes un nombre largo con `white-space: nowrap` estiraba la columna a ~476px (de ahí la separación larga). `.alumno-nombre` ahora truncate con ellipsis (`overflow hidden` + `max-width: 196px`) y tooltip con el nombre completo (`matTooltip="nombreAlumno(a)"`). Fade del borde derecho reducido de 16px → 8px (más corto y más tenue).
- **Delimitación entre filas**: `border-bottom: 1px solid #e9edf4` en `td` (hairline suave), sin borde en la última fila (`tr:last-child td { border-bottom: none }`).
- **Hover de fila completa**: eliminada la excepción que dejaba la columna Alumno en blanco → `tr:hover td` ahora pinta TODAS las celdas (incluida la sticky) con `--fich-bg-subtle` (verificado: alumno y notas computan el mismo rgb(248,250,252)).
- Verificación: `npx tsc --noEmit` limpio + render Playwright real (ed 2): 8 celdas con 1px, última fila 0px, nombre largo truncado (192>184px), columna Alumno = 250px exactos.

## Pulido 4: clasificación del promedio + mismo estilo en docente-calificar (2026-08-07, SIN commit)

- **Promedio con clasificación** (`notas-edicion`): bajo el anillo de progreso ahora aparece una mini-chip `.prom-clasif` con el label de clasificación ("Bueno"/"Distinguido"/"Sobresaliente"...) tintado con el mismo color que el anillo (reusa `promedioClass` + nuevo helper `promLabel(a)` que mapea la key de `clasificarProm` a su label capitalizado). Verificado por render: 78→Bueno, 86→Distinguido, 80→Bueno, 81→Distinguido, 79→Bueno, 98→Sobresaliente, 96→Sobresaliente (clase del label == clase del anillo).
- **`docente-calificar` con el mismo lenguaje visual** (pedido: "aplica el mismo estilo de listado para la vista de agregar notas como docente"):
  - Nota → **burbuja** `.nota-bubble` (píldora tintada por clasificación, `tabular-nums`, escala al hover, vacía = punteada `sin-nota`). Se cambió `.nota-display` por `.nota-bubble` en el HTML.
  - **Leyenda de clasificación** arriba de la tabla (`.matriz-meta-row` + `.matriz-leyenda` con `.leyenda-dot`, justificada a la derecha).
  - Contenedor `.table-container` → radio 18px + gradiente + resplandor **teal** (`rgba(13,148,136,.06)`, identidad docente, no el púrpura de notas) + `--fich-shadow-sm`. Header cells uppercase/letter-spacing con banda `linear-gradient(180deg,#f6fcfb,transparent)` + hairline. Hairline `#e9edf4` entre filas (sin borde en la última). Hover pinta la fila completa.
  - `.cal-badge` ahora es un **chip con dot** (`::before` 7px de `currentColor`, oculto en `sin-nota`). Avatar `.avatar-circle` pasado al estilo tablero (fondo claro teal `linear-gradient(135deg,#f0fdfa,#ccfbf1)`, borde #99f6e4, iniciales #0f766e).
  - **Paleta de clasificación unificada** con notas-edicion (mismos hex: insuficiente #fef2f2/#b91c1c, suficiente #fffbeb/#b45309, bueno #eff6ff/#0369a1, distinguido #ecfdf5/#047857, sobresaliente #eef2ff/#4338ca, abandono/sin-nota gris).
  - Los overrides se agregaron como bloque al final de `docente-calificar.css` (no se reescribió el archivo para no tocar reglas existentes).
- **Verificación docente**: sesión con rol docente generada vía `POST /auth/seleccionar-rol` (usuario 1 → id_rol 5, token en `/tmp/opencode/docente_session.json`). Render de `/docente/calificar/2`: 8 filas, burbujas 85/86 cal-distinguido (bg #ecfdf5) y 78/80 cal-bueno (bg #eff6ff), badges con dot 7px, leyenda presente. `npx tsc --noEmit` limpio.

## Calificar: notas enteras en pantalla + solo lectura fuera de en_curso (2026-08-07, SIN commit)
- **Notas siempre enteras en pantalla** (pedido recurrente de Julio "solo mostremos notas en entero"): `notaDe()` (`docente-calificar.ts`) ahora devuelve `Math.floor(Number(n) + 0.5)` en vez de la nota cruda. Antes el row mostraba el decimal (68.5) y tras ADD/EDIT el backend devuelve `nota` como **string** "74.00" → se veía "74.00" y `calClase()` daba `Math.floor("74.00"+0.5)` = **NaN** → clasificación rota. Fix: `Number()` en `notaDe` + `patchearNotaEnDatos` guarda `nota: Number(resp.nota)`. El dialog de editar (`nota-dialog.ts::notaInicial`) también redondea a entero.
- **Módulo no en curso = solo lectura** (el backend ya rechaza ADD/PATCH con 400 "Solo se pueden editar notas de un módulo en curso", ej. DPM 1 reprogramado, pero la UI mostraba lápices → "el editar no está funcionando"):
  - `moduloEnCurso` computed (`datos()?.modulo.estado === 'en_curso'`).
  - Banner `.modulo-aviso` ámbar "Módulo X — las notas son de solo lectura...".
  - Fila: si no en_curso → `.readonly-note` con candado "Solo lectura" en vez de botones; si en_curso → lápiz (tiene nota) / Agregar nota (sin nota).
  - Header "Agregar nota" también se deshabilita fuera de en_curso.
  - `docente-mis-modulos`: icono del footer `grading` (tooltip "Calificar alumnos") solo para `en_curso`; para otros estados `lock` con tooltip "Ver notas (módulo X — solo lectura)".
- **Sobre el 404 "Nota no encontrada" reportado**: NO reproducible con el estado actual — verificado por API que los 6 PATCH de DPM 3 dan 200 y que no hay `id_nota` huérfanos. Causa más probable: la página cargada con notas de prueba que se borraron por SQL durante la limpieza de sesión (notas 97/98), quedando un id inválido en `notas[0].id_nota` → PATCH 404. El único branch 404 de `editar_nota` (routers/nota.py:217) es `Nota.id_nota == id` inexistente.
- Verificación: `npx tsc --noEmit` limpio + render Playwright real (login Cristian): mis-modulos lock/grading por estado; calificar/1 (reprogramado) banner + 0 lápices + 7 celdas solo lectura; calificar/3 filas enteras (88/91/79/74/85/90); edit dialog precarga entero; **add→editar misma fila** (Julio César Toledo): POST 201 "61.00" → fila "61" → PATCH 200 → fila "63" + clase `insuficiente` (sin NaN). Nota de prueba 101 borrada por SQL tras la verificación.
- Archivos tocados: `docente-calificar.ts|html|css`, `nota-dialog.ts`, `docente-mis-modulos.html`.

### Follow-up 2026-08-07: botón "Editar" con texto + razón visible del botón general deshabilitado

- **"Agregar nota" general NO estaba roto**: quedaba deshabilitado porque ya no quedaban alumnos sin nota en DPM 3 (Julio agregó nota 102 = 96 a "Julio César Toledo Vaca" y editó la de Luke a 98; los 7 alumnos quedaron calificados). `alumnosSinNota().length === 0` → disabled (correcto). Para que no parezca roto, el `hint-note` al pie ahora muestra "Todos los alumnos ya tienen nota en este módulo." cuando no quedan candidatos.
- **Editar deja de ser lápiz simple**: la acción de fila ahora es `mat-raised-button color="primary"` `.btn-nuevo` (misma píldora que "Agregar nota") con `<mat-icon>edit</mat-icon>` + label **"Editar"**. Eliminadas las reglas CSS muertas `.action-btns .mat-icon-button`.
- **Mensajito junto al botón general**: cuando `alumnosSinNota().length === 0` aparece un chip verde `.todos-calificados` (check_circle + "Todos los alumnos ya tienen nota") **al lado** del botón "Agregar nota" deshabilitado, con tooltip. El `hint-note` al pie volvió a su texto fijo (se descartó el texto condicional abajo — Julio quería el mensaje junto al botón).
- Verificación: `npx tsc --noEmit` limpio + render real (calificar/3): chip "check_circle Todos los alumnos ya tienen nota" color rgb(5,150,105), header general `disabled=true`, botón fila "edit\nEditar", hint original.

## Calificar: sin fecha, badge sin prefijo cal-, estilos (2026-08-07)

- **Columna Fecha eliminada** del `docente-calificar` (HTML + TS + CSS). El payload de `POST /notas/` sigue enviando `fecha: this.hoy()` (el backend la exige); `PATCH` ya no manda `fecha` (es opcional, conserva la original).
- **Badge de clasificación sin prefijo `cal-`**: `calificacionViva()` y `calClass()` hacen `clasificarNota(n).replace('cal-', '')` → el badge muestra `suficiente`/`distinguido`/etc. y las clases CSS pasaron a `.sin-nota`, `.abandono`, `.insuficiente`, `.suficiente`, `.bueno`, `.distinguido`, `.sobresaliente` (sin tocar `nota-utils.ts`, que sigue devolviendo `cal-*` para el resto del sistema). Eliminada la const `CAL_LABELS` (quedaba sin uso).
- **Estilos pulidos** (motivo: "algunas cosas no se veían"): header con uppercase/letter-spacing + fondo `--fich-bg-subtle`, hover por fila, anchos de columna fija (CI 110px, Nota 130px, Clasificación 170px, Acción 180px derecha), badges con borde sutil de su color.
- **Botón de acción por fila**: vuelto a `mat-flat-button color="primary"` con el estilo global del sistema `btn-guardar` (indigo, gradiente, sombra, hover lift) + clase local `.guardar-btn` (píldora `radius-full`, 38px, icono `save`/`edit` + label Guardar/Actualizar, spinner al guardar). Se descartó el `mat-icon-button` (el usuario lo rechazó: quería botón con color según acción, no solo icono).
- **Nota input**: solo enteros — `onNotaInput()` sanitiza (`replace(/\D/g,'')`, máx 3 dígitos, clamp 0-100); spinners nativos ocultos vía CSS (`::-webkit-inner-spin-button` + `-moz-appearance: textfield`); `type="number" min=0 max=100 step=1 inputmode="numeric"`. Estilo píldora (`radius-full`), padding 10px, foco con anillo suave (`--fich-primary-light`).
- **Menos cuadrado / más fluido**: `table-wrapper` a `radius-md` (16px), celdas con padding 12px, input y botón como píldoras.
- **Texto lavado en `.btn-nuevo` (fix 2026-08-07, motivo: "las letras siguen grises, no se lee")**: `.btn-nuevo` carecía del fix de stacking que sí tiene `.btn-guardar` (styles.css:482-486) — el overlay `.btn-nuevo::before` (gradiente blanco 12%) quedaba pintado por encima del texto. Se espejó el fix en `styles.css` (`.btn-nuevo .mdc-button__label, .btn-nuevo .mat-mdc-button-persistent-ripple { position: relative; z-index: 1 }` + `z-index: 0` en el `::before`) y en `docente-calificar.css` se forzó `#ffffff` puro sobre button/label/`mat-icon` + vars M3 del label. Análisis de píxeles de la captura de Julio: el texto ya medía ~233-238/255 de brillo (casi blanco) sobre índigo (64,56,192) — la captura mostraba la píldora vieja de 34px (iteración 2), no el `.btn-nuevo` actual de 44px. Verificación: `npx tsc --noEmit` limpio.
- **CAUSA RAÍZ real de "letras índigo invisibles" (2026-08-07, mismo fix)**: la regla global `styles.css` `.page-container .mat-mdc-row .mat-mdc-cell button[color="primary"] { color: var(--fich-primary) !important }` (specificity 0,5,1+!important) matcheaba a CUALQUIER botón con `color="primary"` dentro de una celda de tabla — incluyendo el `mat-raised-button` `.btn-nuevo` de "Agregar nota" por fila → texto **índigo sobre índigo**. El header (fuera de celda) sí era blanco, por eso el general se veía bien. El "+" del icono quedaba blanco (override local sobre `mat-icon`), el label no. **Fix**: se acotó la regla a `.mat-mdc-icon-button` (intención original: colorear el lápiz de editar), con lo cual cualquier botón raised/flat en celdas vuelve a blanco. Verificado por render headless real (Playwright + Chromium, login como Cristian `cristianlol@gmail.com`/`adminjt`, ruta `/docente/calificar/3`, DPM 3 en_curso): header y fila ahora computan `rgb(255,255,255)` sobre `rgb(67,56,202)`; pixel check 230 px blancos en la banda del texto. Scripts de diagnóstico en `/tmp/opencode/shot.js` y `dbg.js` (browser en `~/.cache/ms-playwright/chromium-1234`, playwright en `~/.npm/_npx/e41f203b7505f1fb/node_modules`).

## Calificar vía dialog (2026-08-07) — la edición inline directa en tabla fue rechazada

- **Vuelta al dialog**: Julio rechazó la edición directa en la tabla ("el botón agregar no hace nada", "me sale nota actualizada y me la pone en decimal", "hacelo como Nuevo Tipo/Nuevo Programa, que abra un dialog"). Se eliminó toda la edición inline (`formState`, `FilaNota`, input de nota por fila, botón Guardar/Actualizar por fila).
- **Nuevo `NotaDialog`** (`nota-dialog.ts/html/css` en `docente-calificar/`, patrón `pago-register-dialog`): modo `crear` (select de estudiantes **sin nota** + card de info del alumno + input de nota) o `editar` (card de info + nota precargada). Nota solo entera (sanitiza `\D`, clamp 0-100, sin spinners), preview de clasificación en vivo, botón Agregar/Guardar `mat-flat-button color="primary"` con spinner. El dialog hace el `POST/PATCH` y cierra con `{ dpaId, nota: NotaResponse }`.
- **Página `docente-calificar`**: botón **"Agregar nota"** arriba a la derecha estilo `btn-nuevo` (igual que Nuevo Tipo/Nuevo Programa), deshabilitado si no quedan alumnos sin nota (`alumnosSinNota()` computed). La tabla ahora es de **lectura**: Alumno (ordenable), CI, Nota (display `notaDe(a)`), Clasificación (badge `calClase(a)`), Acción (icono `edit` solo si hay nota → abre dialog en modo editar). Tras guardar se parchea la fila en el lugar (`patchearNotaEnDatos`).
- **Iteración 2 (2026-08-07)**: botón **"Agregar nota" por fila** para estudiantes sin nota (mismo `btn-nuevo` compacto `.btn-agregar-fila`, columna Acción 190px) que abre el dialog en modo `crear` con `fijo: true` (un solo estudiante, sin buscador). El general arriba se mantiene. El selector del dialog ya **no es `mat-select`** sino un **buscador + lista filtrable** (`busqueda` + `filtrados()` por nombre/apellido/CI, filas clickeables con avatar/nombre/CI y estado `.seleccionada`, `.alumnos-lista` scrollable, `.lista-vacia` "Sin resultados"). `NotaDialogData` ganó `fijo?: boolean`; `abrirDialog()` helper privado unifica la lógica de afterClosed en la página. Eliminado `MatSelectModule` del dialog.
- **Iteración 3 — colores de botones (2026-08-07)**: tras dos idas y vueltas quedó fijado — el botón **"Agregar nota"** de cada fila es **idéntico al general** (`mat-raised-button color="primary"` + `btn-nuevo`, azul `--fich-primary` con texto blanco, 44px) y el **"Editar nota"** vuelve al **`mat-icon-button` estándar del sistema** (lápiz `edit` + tooltip, como requisitos/tipo-descuento). Se descartó: el teal por acción (`.btn-agregar-nota`) y el botón editar con label índigo (`.btn-editar-fila`). Los overrides teal/píldora quedaron eliminados del CSS.
- Archivos: `docente-calificar.ts|html|css` reescritos + `nota-dialog.ts|html|css` nuevos. Verificación: `npx tsc --noEmit` limpio.
- **BUGFIX "ni el add ni el patch hacen nada" (2026-08-07, mismo dialog)**: el input de nota es `type="number"` → `ngModelChange` emite un **número**, pero `onNotaInput` hacía `value.replace(/\D/g,'')` → `TypeError` (`.replace` no existe en numbers) → `nota` nunca se actualizaba → `notaNumero()===null` → botón Agregar/Guardar quedaba `disabled` (el badge de clasificación nunca aparecía; el "+"/texto visualmente sí se veían). Fix: `onNotaInput(value: string | number)` → `String(value ?? '')` antes de sanitizar. Afectaba a add y a patch por igual. Reproducido y verificado por render real (Playwright/Chromium, login Cristian `cristianlol@gmail.com`/`adminjt`, `/docente/calificar/3`): POST `/notas/` 201 y PATCH `/notas/:id` 200, dialog cierra, fila se parchea. Data de prueba creada y eliminada por SQL (notas 97/98; nota 96 restaurada a 68.5).
- **Mejoras del dialog (2026-08-07, mismas archivos)**: línea de contexto `.dialog-contexto` bajo el título (sigla del módulo + programa — Ed. N, viene de `datos()` vía `NotaDialogData.contexto` agregado en `abrirDialog()`), **Enter guarda** (`(keydown.enter)="guardar()"` en el input de nota), **select-all al enfocar** (`onFocusNota()`). Verificación: `npx tsc --noEmit` limpio.

## Login automático de docentes + cambio de contraseña forzado (2026-08-07)

- **Pendiente previo resuelto**: al crear un docente desde el CRUD ya NO queda sin usuario. `POST /docentes/` (`routers/docente.py::crear`) ahora auto-crea la cuenta de acceso:
  - Si ya existe un `Usuario` con el correo del docente → se **vincula** (`docente.id_usuario`) sin crear duplicado (mismo patrón que `usuarios.py::crear_usuario`).
  - Si no existe → crea `Usuario(email=correo, password_hash=bcrypt(CI), activo=True, must_change_password=True)` + `UsuarioRol` rol `docente`.
  - `DocenteResponse` expone `usuario_creado: bool`, `email_login: str | None`, `password_inicial: str | None` (solo se llenan en POST; GET/PATCH devuelven null). El CI se usa como contraseña inicial.
- **Columna nueva `usuarios.must_change_password BOOLEAN NOT NULL DEFAULT FALSE`**: aplicada directo a la BD local con psql (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). ⚠️ NO se agregó migración alembic: el árbol de migraciones local está roto pre-existente (dos cabezas divergentes `a1b2c3d4e5f6`/`d4e5f6a7b8c9`, revisión `a1b2c3d4e5f6` duplicada en dos archivos, `alembic_version` desincronizado — la BD local tiene ambas cabezas aplicadas pero la tabla de versiones marca `c2d3e4f5a6b7`). Para producción hay que aplicar el `ADD COLUMN` manualmente.
- **`UserResponse`** (`schemas/auth.py`) y todos sus constructores (`dependencies.py::get_current_user`, `routers/auth.py::registro` y `::seleccionar_rol`) incluyen `must_change_password: bool = False` desde `usuario.must_change_password`.
- **`PATCH /auth/cambiar-password`**: si `must_change_password=True` salta la verificación de la contraseña actual (el usuario aún no conoce la nueva). Al cambiarla → hashea y **limpia el flag** (`must_change_password=False`).
- **Frontend login** (`features/login/pages/login.ts|html`): nuevo paso `step='cambio'`. Tras `seleccionarRol`, si `resp.user.must_change_password` muestra el formulario "Cambiá tu contraseña" (nueva + confirmar, min 6 chars). Al éxito: `auth.logout()` + mensaje "Iniciá sesión con tu nueva contraseña" (re-login con la nueva, confirma que funciona). También cubre el caso de usuario ya logueado con el flag (refresh/`ngOnInit`).
- **Frontend docente-form** (`docente-form.ts` + `credenciales-docente.dialog.ts` NUEVO): al crear con `resp.password_inicial` abre un dialog con correo + contraseña inicial y aviso "Al ingresar por primera vez, el sistema le pedirá crear una nueva contraseña". Si el docente ya tenía usuario (vinculado) → sin dialog, mensaje normal.
- `UserInfo` (`auth.service.ts`) y modelo `Docente` (`docente.model.ts`) actualizados con los campos nuevos.
- **Verificación E2E** (servidor local): crear docente → `usuario_creado:true`, login con CI + seleccionar rol docente → `must_change_password:true`, `cambiar-password` con `password_actual:""` → 200 y flag `f` en BD, login con la nueva contraseña OK. Datos de prueba eliminados. `venv/bin/python -c "import routers.docente, routers.auth, dependencies"` OK; `npx tsc --noEmit` limpio.

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

## Registro de cuenta en wizard 3 pasos (2026-08-07)

- **Backend**: `POST /auth/registro` ahora crea el alumno completo de una sola vez. `RegistroRequest` extendido (`schemas/auth.py`): `ci` opcional + `pasaporte`, `nombre`, `apellido`, `fecha_nacimiento` (date, parsea ISO con `T`), `genero` (`GeneroEnum`), `celular`, `direccion`. Validadores: al menos CI o pasaporte; CI/pasaporte ≥5 (pasaporte `.upper()`); nombre/apellido ≥2 y ≤100 (`.title()`); celular ≥7; correo con `@` (normaliza lower/strip). `routers/auth.py`: duplicados de CI/pasaporte guardados según presencia, alumno con datos reales (fallback `"Pendiente"` solo si no se envían, compat API).
- **Frontend `register.ts/html/css`**: wizard de 3 pasos con stepper visual (patrón `inscribir`): **Cuenta** (correo, contraseña, confirmar) → **Identidad** (nombre, apellido, CI, pasaporte) → **Contacto** (fecha nacimiento con datepicker, género select masculino/femenino, celular, dirección). Validación por paso con snackbar; botones Volver/Siguiente; en el último paso se hace el submit. Snackbar de éxito sin "completá tu perfil". Post-registro: `?incorporar=`/`?inscribir=` → `/alumnos/inscribir/:id`, si no → `/alumnos` (portal → perfil).
- **Sentinel "Pendiente" eliminado del frontend**: `public-home` ya no consulta `getMiPerfil()` ni detecta `nombre === 'Pendiente'`; eliminado el banner "Completá tu perfil" (HTML + CSS) y la traba de inscripción en `inscribirse()`. `perfilIncompleto` y el import/inject de `AlumnoService` removidos.
- `RegistroRequest` frontend (`auth.service.ts`): `ci`/`pasaporte`/`celular`/`direccion` opcionales + `nombre`, `apellido`, `fecha_nacimiento`, `genero`.
- Archivos tocados: `PostgradoBackend/schemas/auth.py`, `PostgradoBackend/routers/auth.py`, `features/login/pages/register.ts|html|css`, `core/services/auth.service.ts`, `features/public-home/pages/public-home.ts|html|css`.
- Verificación: `npx tsc --noEmit` limpio; `RegistroRequest` validado con pydantic (casos OK/error); `routers.auth` importa OK.

## Rediseño gestionar-requisitos-incorporacion (2026-08-07, SIN commit)

- Componente reescrito (single-file, sin plantilla externa): contenedor `90%/1240px`, toolbar con back-btn, tabs dinámicos con badge de conteo (`configs` map cargado de una vez), add-card con select de dos líneas (nombre + descripción), tabla `fich-table` con columna `#` y avatar por tipo (incorporación `#eef2ff/#1e3a8a`, migración `#f0fdfa/#0d9488`, reincorporación `#f5f3ff/#4f46e5`), estado "todos agregados" en verde, `delete_outline`, info-note. Descripción resuelta en cliente vía `requisitoById()` (el backend solo manda `requisito_nombre`). `npx tsc --noEmit` limpio. **Pendiente de commit.**

## Aprobar incorporación: módulo de inicio con fechas y casos (2026-08-07)

- **Selector inteligente en `revisar-incorporacion`**: reemplazado el `mat-checkbox` "Incorporar al módulo en curso" por un `mat-radio-group` de opciones con cards (nombre + orden, badge de estado y de recomendación, fechas Inicio → Fin, barra de % cursado). Decisiones de negocio confirmadas por Julio:
  - **Caso A** (módulo `en_curso` con progreso ≥50%): se preselecciona **Siguiente módulo** como "Recomendado" pero queda editable.
  - **Caso B** (`en_curso` con progreso <50%): se preselecciona el módulo en curso.
  - **Caso C** (sin módulo en curso): opción única "Próximo módulo"; si está `programado` sin `fecha_inicio`, aviso ámbar "aún no tiene fecha de inicio asignada".
  - Todos finalizados → aviso de error y sin selector.
  - Progreso = `(hoy - fecha_inicio)/(fecha_fin - fecha_inicio)` clamp 0-100; si falta fecha_fin → null → se trata como recién empezado. Fechas parseadas con `aDate()` (sin bug de timezone).
- `cargarModulos()` preselecciona la opción recomendada; `aprobar()` envía `id_modulo_inicio` directo del radio (ya no posición 0/1). Vale para incorporación y migración. Reincorporación sigue sin selector (conserva módulo).
- **Transcript robusto ante reordenamiento**: `routers/nota.py` `transcript_alumno` ahora resuelve `modulo_inicio` desde `dpa.id_modulo_inicio` (FK) → orden **actual** del módulo anclado (nuevo map `dpm_by_id`), fallback al snapshot. Así los marcadores cursado/saltado del transcript sobreviven a cambios de orden de módulos.
- Archivos tocados: `revisar-incorporacion.ts|html|css`, `PostgradoBackend/routers/nota.py`.
- Verificación: `npx tsc --noEmit` limpio; `nota.py` compila e importa OK.

## Módulo de inicio estático en solicitudes ya decididas (2026-08-07)

- **Pedido de Julio**: en solicitudes `aceptado`/`rechazado` la sección de módulo de inicio seguía mostrando los radios movibles (daban falsa impresión de edición). Ahora esa sección es **estática** — un simple registro, no un control.
- **Backend** (`PostgradoBackend/schemas/solicitud.py`, `routers/solicitud.py`): `SolicitudConDetalle` ahora expone `dpa_modulo_inicio` (snapshot numérico del DPA) y `dpa_id_modulo_inicio` (FK al DPM anclado) para que el frontend pueda resolver el módulo real asignado. `_load_con_detalle` los llena desde el DPA de origen.
- **Frontend `revisar-incorporacion`**:
  - `esPendiente()` computed (estado === 'pendiente') condiciona toda la interactividad.
  - `moduloAsignado()` computed: resuelve el módulo por `dpa_id_modulo_inicio` (preferido) o por `dpa_modulo_inicio` sobre `modulosEdicion()`.
  - **Módulo de inicio**: `@if (esPendiente())` muestra el radio-group actual; si no, renderiza `.modulo-registro` (icono flag, título "orden. nombre", fechas Inicio/Fin, badge de estado del módulo) + nota con candado "Solicitud aprobada/rechazada — módulo asignado al momento de la decisión". Si no hay módulo resoluble → `.modulo-aviso.aviso-muted` "Sin módulo asignado".
  - **Configuración de Migración**: `@if (esPendiente())` muestra select + textarea; si no, `.migracion-registro` estático con filas "Edición destino" (via `edicionDestinoLabel()` computed: resuelve de `migracion.id_edicion_destino` sobre `ediciones()`, fallback a `programa_nombre`+`edicion_numero` del detalle) y "Motivo" (`sol.motivo`).
  - CSS nuevo: `.modulo-registro`, `.registro-icon`, `.registro-info`, `.registro-titulo`, `.registro-fechas`, `.modulo-registro-note`, `.migracion-registro`, `.registro-fila`, `.registro-label`, `.aviso-muted`.
- Modelo frontend `SolicitudConDetalle` (`solicitud-incorporacion.model.ts`): `dpa_modulo_inicio`/`dpa_id_modulo_inicio` agregados.
- Verificación: `npx tsc --noEmit` limpio; `schemas/solicitud.py` + `routers/solicitud.py` compilan e importan OK.

## Bugfix reordenar módulos: mensaje y efecto secundario (2026-08-07)

- **Síntoma (Julio)**: al mover el módulo 2 (en curso) contra el 3, el diálogo "Cronología de módulos" fallaba con "No se puede reordenar: hay módulos finalizados en la edición" aunque no había finalizados. Reprogramado el módulo, seguía el mismo mensaje.
- **Causa raíz**: `POST /detalle-programa-modulo/reordenar` corría `actualizar_estado_auto()` sobre todos los módulos **antes** de validar. Esa función muta estados como efecto secundario: un módulo `en_curso` con `fecha_fin` pasada → `finalizado` (de ahí el mensaje engañoso), y un `reprogramado` con `fecha_inicio <= hoy` vuelve a `en_curso` y de ahí a `finalizado` si la fecha fin ya pasó. Por eso reprogramar no destrababa nada. Además, el bloqueo era "global": bastaba **un** módulo finalizado (aunque estuviera anclado en su posición) para impedir reordenar los demás.
- **Fix** (`PostgradoBackend/routers/detalle_programa_modulo.py` `reordenar`): se eliminó la llamada a `actualizar_estado_auto()` (el reorden no debe cambiar estados de módulos). La validación es **por módulo movido**, sobre el estado guardado:
  - solo se bloquea si un módulo `en_curso` o `finalizado` **cambia de posición** → 400 "No se puede reordenar: no se puede mover un módulo en curso/finalizado"
  - un finalizado que queda en su lugar NO impide reordenar módulos `programado`/`reprogramado` (caso de Julio: intercambiar orden 2 y 3 con el DCI-101 finalizado anclado en orden 1)
- `actualizar_estado_auto` sigue usándose en `crear`, `listar` y `obtener` (no se tocó).
- Verificación: `detalle_programa_modulo.py` compila e importa OK.

## Recomendación de ediciones destino por afinidad en migración (2026-08-07, SIN commit)

- **Endpoint nuevo** `GET /solicitud/{id_solicitud}/destinos-recomendados` (admin `alumnos.editar`, `PostgradoBackend/routers/solicitud.py`, final del archivo) con helpers `_motivo_destino`/`_motivo_recomendado`:
  - **Pendientes del alumno**: DPMs del origen con `orden >= dpa.modulo_inicio` y **sin nota aprobatoria** (usa `clasificar_nota`: suficiente/bueno/distinguido/sobresaliente). Comparación **por `id_modulo`**, sin importar la posición (decisión confirmada por Julio).
  - **Candidatas**: mismo `id_programa_version`, `es_historico=False`, `estado in {programado, en_curso, reprogramado}` (nunca `finalizado` como destino — consistente con `GET /programa-version-edicion/?activas=true`), distinta edición y no en las ediciones del alumno.
  - **Afinidad** = módulos pendientes que existen en el destino y **no están `finalizado`**. `afinidad_pct = round(100*aprovechables/total)`, `cupo_disponible = cupo_maximo − DPA no retirado/observado`.
  - **Sort**: `(-aprovechables, -afinidad, -cupo_disponible, fecha_inicio null-last asc, precio asc, id asc)`; el ganador se marca `recomendado=True`. Desempate documentado: cupo → fecha más próxima → menor precio → menor id.
- **Schemas** (`schemas/solicitud.py`): `ModuloPendiente`, `ModuloCoincidencia`, `DestinoRecomendado`, `DestinosRecomendadosResponse`.
- **Frontend `revisar-incorporacion`**: selector de edición destino en migración pendiente reemplazado por **cards radio rankeadas** (patrón `opcionesModulo()`: `.opcion-card`/`.opcion-recomendada`/badge `Recomendado`/`badge-afinidad` con %, estado, periodo, cupo, precio, modalidad, motivo de recomendación, aviso de no aprovechables). Señales `destinos`, `pendientesDestino`, `destinosLoading`; `cargarDestinosRecomendados()` se dispara al cargar la solicitud si `esMigracion() && esPendiente()` y preselecciona automáticamente la recomendada (`onEdicionChange`). Fallback al `<select>` si no hay destinos. Banner `.pendientes-note` con los módulos pendientes.
- **Modelo frontend** (`solicitud-incorporacion.model.ts`): interfaces `ModuloPendiente`, `ModuloCoincidencia`, `DestinoRecomendado`, `DestinosRecomendadosResponse`. **Servicio**: `destinosRecomendados(idSolicitud)`.
- **Seed de prueba aplicado** (`/tmp/opencode/seed_migracion.sql`): ed 3 → `finalizado` + DPMs 7-12 finalizados; ed 5 → DPM 24 (M6) `finalizado`; alumno **Obi Wan Kenobi** (`ci=8888888`, `obiwan@gmail.com`/`adminjt`, rol 7) con DPA 66 en ed 3 (`incorporado`, `modulo_inicio=5`), nota 54 en M5 (=78 aprobado), pago matrícula aprobado → pendiente = **{M6}**. Solicitud pendiente 1019 creada para el test.
- ⚠️ **ERROR DE SESIÓN ANTERIOR CORREGIDO**: "ed 3" se interpretó como `id_programa_version_edicion=3`, que en realidad era la **edición 5 real del usuario** (pve 3, virtual, sem1/2027, cupo 80). El seed la marcó `finalizado` con fechas 2026-01→07 inventadas, igual que sus DPMs 7-12 y el DPM 24 (M6 de la edición 7). **Nunca se creó una edición 3.**
- **Corrección aplicada** (`/tmp/opencode/seed_crear_ed3_real.sql`): restauró **ed 5** (pve 3) a `programado` sin fechas (y sus DPMs 7-12 a `programado` sin fechas) y el **DPM 24** (M6 ed 7) a `programado` sin fechas; creó la **EDICIÓN 3 REAL** (pve 6, `edicion=3`, `finalizado` 2026-01-01→07-01, presencial, sem1/2026, precio 6600, cupo 80, `es_historico=false`) con sus 6 DPMs 25-30 `finalizado` (fechas mensuales 2026, orden de `id_modulo` 2,1,3,4,5,6 igual al resto); movió los 7 DPAs de prueba (66 Obi + 67-72 completos) a la ed 3 y **re-mapeó sus notas** de los DPM viejos 7-12 → nuevos 25-30 (sino el pendiente computaba M4+M5+M6). `id_modulo_inicio` de los DPAs actualizado a los DPM nuevos (25 para completos, 28 para Obi).
- **Ediciones finales (pv 1)**: Ed 3 (pve 6, `finalizado`), Ed 4 (pve 2, `en_curso`), Ed 5 (pve 3, `programado`), Ed 6 (pve 4, `programado`), Ed 7 (pve 5, `programado`). La ed 3 ya aparece en `edicion-list` (backend `listar` no filtra por estado).
- **Seed ed 3 completa** (`/tmp/opencode/seed_ed3_completa.sql`, aplicado): limpió la basura de prueba de la ed 3 (7 DPAs viejos con sus notas/pagos/control_documentacion + solicitud 1002), creó **6 estudiantes completos** (Ana/Carlos/Daniela/Jorge/Verónica/Marcelo, DPA 67-72 `finalizado`, m_ini=1, 6 notas aprobadas M1-M6, matrícula 2500 + 6 cuotas, 3 docs aprobados) y **arregló a Obi**: `modulo_inicio=4` (incorporado en M4), notas solo en los últimos 3 módulos (M4=82, M5=78, M6=**54 insuficiente**) → pendiente = **{M6}**, necesita migrar. M4/M5/M6 de la ed 3 = `id_modulo` 4/5/6, consistentes entre ediciones.
- **Verificación**: `npx tsc --noEmit` limpio; `solicitud.py`/`schemas/solicitud.py` compilan e importan OK; `GET /solicitud/1019/destinos-recomendados` responde el ranking esperado — con la ed 3 real, Obi (m_ini=4, notas M4/M5/M6, M6 insuficiente) tiene pendiente **{M6}** y el ranking es Ed 6 (pve 4, 100%, recomendada por cupo 94) > Ed 5 (pve 3, 100%, cupo 80) > Ed 7 (pve 5, 100%, cupo 50) > Ed 4 (pve 2, 100%, cupo 39).

## Migración con documentos + botón retirar + test data afinidad (2026-08-07, SIN commit)

### 1) Card de migración ahora pide los documentos (no solo el motivo)
- **Pedido de Julio**: "cuando quiero hacer migración solo me deja mandar el motivo. no me pide los documentos." — el flujo de migración quedó espejo del de reincorporación (apartado con motivo + lista de requisitos configurados).
- **Backend/DB**: requisito nuevo **"Carta de Solicitud de Migración"** (`requisitos` id 8, activo). `solicitud_requisito` del tipo 2 (migración) reconfigurado: se quitó el requisito 6 (Carta de Solicitud de Incorporación, quedó `inactivo` en `requisitos`) y se configuró **req 8**. Config activa: tipo 1 → req 6 + req 1; tipo 2 → req 8; tipo 3 → req 7 + req 3.
- **Frontend `inscripcion-detail.ts`**: señales `requisitosMigracion` (SolicitudRequisito[]), `migrReqFiles` (Record<id_requisito,{file,name,size}>), computed `migrReqSubidos()`; métodos `onMigrReqFileSelected()`, `quitarMigrReqFile()`, `_cargarRequisitosMigracion()` (llamado en `cargarInscripcion()`), `_subirMigrReqFiles(sol)` (sube en secuencia mapeando `id_requisito` → `id_solicitud_documento`). `solicitarMigracion()` crea la solicitud y sube todos los archivos en secuencia; `confirmarMigracion()`/`cancelarMigracion()` limpian los archivos al confirmar/cancelar.
- **HTML**: el form de migración muestra `.migracion-info-note` ("Al enviar la solicitud se adjuntarán los documentos requeridos...") + la lista de requisitos con botón de selección de archivo por requisito (chip con nombre + quitar), espejo de reincorporación.
- **CSS**: `.migracion-info-note` agregado.

### 2) Botón "Retirarse" oculto cuando la edición finalizó
- **Pedido de Julio**: "una vez que la edición termina al alumno no tiene por qué aparecerle el botón de retirarse de esta edición".
- **Fix**: `puedeRetirarse()` (TS) ahora retorna `false` cuando `edicion()?.estado === 'finalizado'` — la danger-zone con el botón de retiro se oculta al terminar la edición.

### 3) Test data para verificar la detección de afinidad
- **Pedido de Julio**: "crea otro alumno con el mismo caso de obi wan pero que no tenga afinidad con todos los módulos para que se note si sirve la detección".
- **Aplicado** (`/tmp/opencode/seed_luke_migracion.sql`): se marcó **DPM 24 (M6 de la ed 7, pve 5) como `finalizado`** (diferenciador: ese módulo ya no es aprovechable como destino) y se creó **Luke Skywalker** (`luke.skywalker@gmail.com`/`adminjt`, rol 7, DPA 74 en ed 3) con el **mismo caso que Obi**: `incorporado`, `modulo_inicio=4`, `id_modulo_inicio=28`, notas M4=82, M5=78, **M6=54 insuficiente** → pendiente = **{M6}**. Pago matrícula aprobado. Solicitud de migración **pendiente 1021** creada para el test.
- **Verificación**: `GET /solicitud/1021/destinos-recomendados` devuelve el ranking diferenciado — Ed 6 (pve 4, 100%, cupo 93, **recomendada**) > Ed 5 (pve 3, 100%, cupo 80) > Ed 4 (pve 2, 100%, cupo 39) > **Ed 7 (pve 5, 0%, "Cubre 0 de 1 módulo(s) pendiente(s)... No aprovechables: Gestión Estratégica...")**. La ed 7 cae al último porque su M6 está `finalizado`. La detección ahora se nota: antes todos los destinos daban 100% y no se distinguía.
- Nota: Obi (solicitud 1019 `rechazado`) ya no es evaluable por `destinos-recomendados` (requiere `pendiente`); Luke es el caso vivo del test. Reversión comentada al final del seed.

## Aplanamiento de rutas: shell admin eliminado + navbar dinámico (2026-08-07, SIN commit)

- **`features/admin/` eliminado** (`admin.ts/html/css` + `routes/admin.routes.ts`). El bug de fondo: el navbar solo mostraba el botón "Admin" con `roles.gestionar`, escondiendo features a roles con permisos parciales (ej. contable con `pagos.ver` no llegaba a Pagos). Ahora cada feature es top-level con su propio `permisoGuard`.
- **Config única de navegación**: `core/config/nav.config.ts` define `NAV_ITEMS` (16 ítems con path/label/icon/feature-color/permiso/group + loader), `NAV_GROUP_LABELS` (Inicio/Catálogos/Docentes/Estudiantes/Sistema) y el tipo `NavItem` (con `kind: 'component'|'children'`, `build: false` para excepciones). Agregar feature/permiso = tocar un solo lugar.
- **`core/config/nav-routes.ts`**: `buildNavRoutes()` genera las rutas top-level desde NAV_ITEMS (path sin `/`, `permisoGuard(item.permiso)`, `loadComponent` o `loadChildren` según `kind`). Excluye `build: false` (dashboard, requisitos, modalidades por guards especiales/mixtos).
- **`app.routes.ts` reescrito**: rutas planas — dashboard (con `dashboardGuard` que redirige alumnos a `/alumnos`), requisitos, modalidades, alumnos (portal estudiante), `solicitudes/:idSolicitud/revisar`, `requisitos-incorporacion`, `transcript/:idAlumno` + `...buildNavRoutes()` + catch-all `**` → `''`.
- **Colisiones resueltas**: la lista admin de alumnos pasó de `/alumnos` a **`/estudiantes`** (el portal del alumno conserva `/alumnos`). Guards de `requisitos` y `modalidades` movidos de la ruta padre al `loadComponent` de la lista (`requisitos.routes.ts`/`modalidad.routes.ts`), dejando el detalle `:id` público para el alumno.
- **Navbar reescrito** (`navbar.ts/html/css`): filtra `NAV_ITEMS` por permiso (`hasPermiso`), agrupa con separadores por `group`, scroll horizontal con `overflow-x: auto` + scrollbar oculta, fade de bordes via `mask-image` cuando hay overflow (`.has-overflow`), y flechas ‹ › (`scrollNav(dir)`, `ResizeObserver` + `scrollBy`) visibles solo con overflow. Estados vacíos/loading no aplican (es toolbar).
- **Feature colors agregados en `material-theme.scss`**: `--fich-feature-roles`, `--fich-feature-requisitos`, `--fich-feature-modalidades`, `--fich-feature-descuentos`, `--fich-feature-documentacion`, `--fich-feature-inscripciones`, `--fich-feature-pagos`, `--fich-feature-notas`, `--fich-feature-solicitudes` (+ `-light`).
- **33 `router.navigate(['/admin/...'])` renombradas** en 12 componentes: `transcript.ts`, `doc-matriz.ts`, `documentacion.ts`, `notas-edicion.ts`, `notas-admin.ts`, `pagos-edicion.ts`, `pagos-admin.ts`, `inscripcion-landing.ts`, `inscripcion-edicion.ts` (inscripciones-edicion), `solicitudes-incorporacion.ts`, `revisar-incorporacion.ts`, `gestionar-requisitos-incorporacion.ts`. Mapeo: `/admin/inscripciones`→`/inscripciones`, `/admin/documentacion`→`/documentacion`, `/admin/notas`→`/notas`, `/admin/pagos`→`/pagos`, `/admin/transcript`→`/transcript`, `/admin/solicitudes-incorporacion`→`/solicitudes`, `/admin/requisitos-incorporacion`→`/requisitos-incorporacion`.
- **Bug #34 arreglado**: stat "Alumnos" del home (`home.html`) apuntaba a `/alumnos` (portal estudiante) → ahora `/estudiantes` (lista admin). Nota: el recap de la sesión anterior afirmaba un cambio a `/estudiantes` y una ruta `/pagos-resumen/:idAlumno` que NO existían en el repo (el componente `pagos-resumen` nunca existió) — se corrigió sobre el estado real.
- Verificación: `npx tsc --noEmit` limpio; `grep /admin` en `src` = 0; `git status` con 26 cambios (22 M + 4 D).

## Portal docente separado del CRUD admin (2026-08-07, SIN commit)

- **Nueva ruta top-level `/docente`** (portal del docente logueado), separada del CRUD admin `/docentes`. `docente-portal.routes.ts`: `''` → portal (`notas.ver`), `mis-modulos` (`notas.ver`), `calificar/:idDpm` (`notas.subir`).
- **`docente-portal` (NUEVO componente)**: perfil read-only del docente logueado, cargado con `DocenteService.getById(auth.user().id_profile)`. Header con avatar (iniciales), badges (Docente / Dictando), grid de info (CI+extensión, correo, celular, género, grado, título), botón "Mis Módulos" + card clickeable "Mis Módulos" con CTA.
- **`docente.routes.ts`**: eliminadas `:id/calificar/:idDpm` y `:id/mis-modulos` (quedan `''`, `nuevo`, `editar/:id`, `:id`).
- **`docente-mis-modulos.ts`**: `idDocente` ahora sale de `auth.user()?.id_profile` (ya no del param `:id`); navega a `/docente/calificar/:idDpm` y volver → `/docente`.
- **`docente-calificar.ts`**: `idDocente` sale de `auth.user()?.id_profile` (ya no de `route.parent.paramMap`); volver → `/docente/mis-modulos`. Inyectado `AuthService`.
- **`navbar.ts`**: `docenteItems` sin "Oferta Académica"; "Mi Perfil" → `/docente`, "Mis Módulos" → `/docente/mis-modulos` (sin id en la URL). Eliminados `misModulosRoute()` y el map de path por rol en `navItems()`.
- **`login.ts`**: `redirectAfterLogin` docente → `/docente/mis-modulos`.
- **`notas-edicion` (matriz read-only)**: eliminados `agregarNota()`/`editarNota()` y el `NotaRegisterDialog` (backend: `POST`/`PATCH` de notas ya exige perfil docente + contratación + módulo `en_curso`, así que admin no puede calificar desde la matriz). Botón "Agregar Nota" y columna de acciones de edición removidos del HTML.
- **`home.ts`**: card de Acceso Directo "Alumnos" → `/estudiantes` (era `/alumnos`, portal estudiante, en un dashboard admin).
- Verificación: `npx tsc --noEmit` limpio; `grep mis-modulos|calificar` en `src` = solo rutas `/docente/...`; sin referencias a `/docentes/:id/mis-modulos|calificar`.

## Reordenar módulos: intercambio de fechas por posición (2026-08-07, SIN commit)

- **Regla de negocio (Julio)**: las fechas quedan **ancladas a la posición (slot)** del cronograma, no al módulo. Al reordenar, cada módulo **hereda la fecha del puesto donde cae**. Si todos estaban pendientes → todos quedan pendientes; si el slot 1 tenía fecha y el 2 no, al intercambiarse el módulo que cae en el slot 1 toma la fecha y el que sale queda pendiente. El cronograma (set de fechas por posición) no cambia.
- **Backend** (`PostgradoBackend/routers/detalle_programa_modulo.py` `reordenar`):
  - Snapshot posicional `fechas_por_slot` = (fecha_inicio, fecha_fin) por índice 1..N sobre los módulos ordenados por `orden` **actual** (posicional, tolera huecos en orden).
  - Tras aplicar el nuevo orden, cada módulo toma las fechas de `fechas_por_slot[nuevo_orden]` (solo si difieren).
  - **Clamp anti-pasado**: un módulo `programado`/`reprogramado` nunca puede quedar con `fecha_inicio` en el pasado → si el slot heredado está vencido, se clampa a **hoy** + duración (≥30). Nunca se marca `finalizado` automáticamente (se conserva el bugfix previo: `reordenar` no llama a `actualizar_estado_auto`).
  - Por cada módulo afectado: `HistorialModulo` ("Reordenamiento — fechas intercambiadas entre módulos") + sync de contratación activa (fechas + `verificar_disponibilidad`, patrón `editar`).
  - Respuesta: `{ mensaje, modulos_afectados: [{id_detalle_programa_modulo, sigla, fecha_inicio, fecha_fin}] }`.
  - `en_curso`/`finalizado` siguen sin moverse → su slot conserva su fecha intacta.
- **Frontend** (`reordenar-modulos-dialog.ts`): **preview del intercambio** — al abrir se captura `fechasPorSlot[]` (fechas originales por posición); cada ítem muestra la fecha que **heredará** (`fechaHeredada(i)`, aplica el mismo clamp a hoy) con resaltado `.reorden-fechas-cambiada` si cambia respecto a la propia. Hint actualizado ("las fechas quedan ancladas a la posición..."), snackbar "Orden y fechas actualizados con éxito".
- **Descartado (Julio)**: el cascade manual de fechas en `detalle-gestionar` no se implementa — el intercambio al reordenar cubre el caso.
- Verificación: `venv/bin/python -c "import routers.detalle_programa_modulo"` OK; `npx tsc --noEmit` limpio; algoritmo testeado en `/tmp/opencode/test_intercambio.py` (5 casos: M1→pos3, todos pendientes, swap puro, clamp fecha pasada, anclado en_curso).

## Bugfix: usuario de docente no veía sus módulos (2026-08-07, SIN commit)

- **Síntoma (Julio)**: creó el docente Cristian (correo cristianlol@gmail.com) con 2 módulos en curso. Al crearle el usuario de login manualmente (`cristianlol@gmail.com`, rol docente) y loguearse, el portal docente **no mostraba ningún módulo** aunque el panel admin sí los mostraba.
- **Causa raíz**: `routers/usuarios.py::crear_usuario` creaba un **`Docente` nuevo** vinculado al usuario (`id_usuario`), sin buscar un docente existente con ese correo. Resultado: dos docentes con el mismo correo — el real (con las contrataciones, `id_usuario=NULL`) y el duplicado (sin módulos, `id_usuario=<usuario>`). `_obtener_profile_info` (`dependencies.py`) resuelve el perfil docente vía la FK `docentes.id_usuario` → login apuntaba al **duplicado vacío** → cero módulos.
- **Fix backend** (`routers/usuarios.py::crear_usuario`):
  - Antes de crear, busca un `Docente` activo por correo (`func.lower(correo) == email`, ordenado por id) → `docente_a_vincular`.
  - Si existe: se **vincula** (`docente.id_usuario = usuario.id_usuario`) en vez de crear duplicado; si ya tiene otro `id_usuario` → 400.
  - El check de CI duplicado **excluye** al docente que se va a vincular (si la CI ingresada es la suya, no bloquea).
  - Se omite la creación del `Docente` duplicado en el bloque de perfiles cuando hay vínculo.
- **Fix de datos aplicado** (local): `UPDATE docentes SET id_usuario=59 WHERE id_docente=2` (docente real con las 2 contrataciones) + `UPDATE docentes SET id_usuario=NULL, estado='inactivo' WHERE id_docente=5` (duplicado bogus desactivado, sin DELETE físico).
- **Verificación**: `_obtener_profile_info(usuario 59, 'docente')` → `id_profile=2` con 2 contrataciones activas (módulos 1 y 3); `notas/por-docente` resuelve desde `id_profile`. `venv/bin/python -c "import routers.usuarios"` OK.
- **Pendiente previo resuelto (2026-08-07)**: auto-crear el login al crear un docente desde el CRUD YA está implementado — ver sección "Login automático de docentes + cambio de contraseña forzado" más arriba.

## Historial

Para logs de sesión detallados, ver `git log --oneline` en ambos repos. Cada feature relevante tiene su commit message descriptivo.
## Docente-calificar: columnas parejas + burbujas y píldoras re-aplicadas (2026-08-08, SIN commit)

- **Contexto**: Julio reportó "la tabla se descuadró" y pidió "que el ancho de los nombres se adapte al nombre más largo de la lista de estudiantes; por lo demás que tengan un ancho parejo todos". `git status` mostró que el Pulido 4 sobre `docente-calificar.*` se había **revertido** (archivos en estado commiteado) → había vuelto a los anchos fijos desparejos (CI 110 / Nota 100 / Clasificación 170 / Acción 210).
- **Columna Alumno adaptativa**: `alumnoWidth` signal + `medirColumnaAlumno()` (mide el `scrollWidth` del `.alumno-nombre` más ancho tras el render vía `requestAnimationFrame`, suma avatar 32 + gap 10 + padding 32) → `[style.width]` en el th/td alumno. Render real: Alumno = 291px (nombre más largo de DPM 3).
- **Ancho parejo**: `table-layout: fixed` en `.calificar-table` (min-width 620px + `.table-wrapper` con overflow-x auto para pantallas angostas). Con fixed layout, las 4 columnas sin ancho explícito (CI/Nota/Clasificación/Acción) **reparten equitativamente el espacio restante** (render real: 275px cada una, exactamente iguales). Se eliminaron los `width` fijos de `.mat-column-*`.
- **Estilo tablero re-aplicado**: `.nota-display` → `.nota-bubble` (píldora tintada por clasificación, `sin-nota` = punteada con "—", escala al hover), `.cal-badge` con **dot** `::before` de 7px `currentColor` (oculto en `sin-nota`), paleta unificada con notas-edicion (insuficiente #fef2f2/#b91c1c, suficiente #fffbeb/#b45309, bueno #eff6ff/#0369a1, distinguido #ecfdf5/#047857, sobresaliente #eef2ff/#4338ca, abandono #f1f5f9/#64748b), **leyenda** `.matriz-meta-row` + `.matriz-leyenda` arriba de la tabla (Sobre./Dist./Bueno/Suf./Insuf./Aband.), contenedor `.table-wrapper` radio **18px** + gradiente teal radial + glow, header cells con banda `linear-gradient(180deg,#f0fdfa,...)` + hairline `#e9edf4` (sin borde en la última fila), avatar lite teal (gradiente #f0fdfa→#ccfbf1, borde #99f6e4, texto #0f766e).
- **⚠️ Lección de build**: `npx tsc --noEmit` **NO** detecta los errores del compilador Angular (`ngtsc`). Un `viewChild('x', { read: ElementRef })` con locator string resolvió un overload sin `read` → el signal quedó tipado `{}` y TS2339/TS7006 solo aparecieron en `ng serve`/`ng build`. Fix: `@ViewChild('tablaWrap', { read: ElementRef })`. Verificar SIEMPRE con el build real (o `ng build`), no solo `tsc`.
- **⚠️ Dev server congelado**: el `ng serve` que corría en pts/1 (PID 68822, arrancado 19:10) había dejado de recompilar (bundle viejo: 0 hits de `medirColumnaAlumno` tras touch). Se reinició en background: `nohup npx ng serve --port 4200 > /tmp/opencode/ngserve.log 2>&1 &` (nuevo PID 81434). Si algo del frontend parece "viejo", revisar ese log.
- Verificación: build de `ng serve` completo OK + render Playwright real (Cristian, `/docente/calificar/3`): `table-layout: fixed`, ths = [291, 275, 275, 275, 275], tds primera fila idem, 7 filas, burbujas `nota-bubble bueno` (bg #eff6ff) / `sobresaliente` (#eef2ff), badges con dot 7px de `currentColor`, leyenda de 6 ítems, wrapper radius 18px con gradiente teal. Screenshot `/tmp/opencode/col.png`. `npx tsc --noEmit` limpio.
- Archivos tocados: `docente-calificar.html|css|ts`.

## Matriz admin (notas-edicion): nombre adaptativo + columnas parejas + promedio alineado (2026-08-08, SIN commit)

- **Pedido de Julio** ("volvamos al lado del admin"): "el ancho del nombre no se está aplicando, hay nombres cortados con ... y las notas no se están distribuyendo el ancho de manera equitativa; los promedios finales unos están más a la izquierda otros más a la derecha, parece una barra chueca".
- **Causas medidas por render (ed 2)**:
  1. Alumno columna fija `250px` + `.alumno-nombre` con `max-width:196px` + ellipsis → "Flores Aparicio Maria Cristina" truncado (scrollW 192 > clientW 184).
  2. Prom columna 298px vs 140px de cada módulo (auto layout reparte según contenido).
  3. **"Barra chueca"**: `.prom-wrap`/`.prom-clasif` estaban en el HTML pero **sin CSS** (se perdió en la reversión) → `.prom-wrap` quedó `display:inline`, así el anillo y el chip "Bueno"/"Sobresaliente" iban lado a lado y el ancho variable del chip movía el anillo a distinta X por fila.
- **Fixes** (`notas-edicion.html|css|ts`):
  - `.matriz` → `table-layout: fixed; width: 100%; min-width: 780px` (era `min-width: max-content`). Se quitaron los `min-width:68px` de `col-mod`/`col-prom`. Con fixed layout las 6 columnas de módulo + Prom reparten el resto **por igual**.
  - **Alumno adaptativa**: `alumnoWidth` signal + `medirColumnaAlumno()` (scrollWidth del nombre más ancho + avatar 36 + gap 10 + padding 20 + 4), bind `[style.width]` en th/td `.col-alumno` de ambas tablas (activos + retirados). Se eliminó `width:250px`, `max-width:196px` y el ellipsis → sin nombres cortados.
  - `.prom-wrap { display:inline-flex; flex-direction:column; align-items:center; gap:3px }` + `.prom-clasif` como píldora (font 0.6rem, capitalize, padding 2px 8px, tintada por la clase `cal-*`). Anillo y chip centrados como unidad → todas las filas alinean.
- **Verificación render real (ed 2)**: `table-layout: fixed`, Alumno = **262px** (nombre largo ya no truncado), módulos 1-6 y Prom = **161px cada uno**, anillos todos en **X=1394** (alineados), `prom-wrap` inline-flex column. Docente-calificar intacto (291/275×4). `npx tsc --noEmit` limpio + build ng serve OK. Screenshot `/tmp/opencode/matriz.png`.

### Follow-up matriz admin: aire al nombre + CI heredaba text-align center (2026-08-08, SIN commit)

- **Aire al nombre**: buffer de `medirColumnaAlumno()` subido de `+4` a `+12` → columna Alumno pasa de 262px a **270px** (render real).
- **CI "chueco" = texto centrado por herencia**: `.matriz td` tiene `text-align: center` (centra burbujas/anillos). `.alumno-nombre`/`.alumno-ci` son blocks que **heredaban** ese center → los nombres cortos y todos los CI se centraban dentro de su bloque (ancho variable según el nombre), mientras los nombres largos llenaban el bloque y parecían "a la izquierda". **Fix**: `text-align: left` en `.alumno-cell` (lo heredan los dos).
- Además `.alumno-info` ahora `flex: 1` → el bloque del CI es uniforme (204px en las 7 filas) y nombre/CI llevan `overflow:hidden + text-overflow:ellipsis` como safety (matTooltip ya muestra el nombre completo).
- Verificación por medición del **texto** (Range.getClientRects, no solo el bloque): nombre y CI arrancan en X=161 en las 7 filas de la ed 2; `text-align:left` computado. Columnas de notas siguen parejas (160px) y anillos en X constante. `npx tsc --noEmit` limpio.

## Docente-calificar: mismo estilo de la matriz admin (2026-08-08, SIN commit)

- **Pedido de Julio**: "ese mismo mismo estilo" (el de la matriz admin recién aprobado) para la tabla de estudiantes del docente en su módulo.
- **Celda Alumno espejo de la matriz**: avatar + `.alumno-info` (`.alumno-nombre` + `.alumno-ci` "CI: X" apilados debajo), `text-align: left`. Se **eliminó la columna CI** (en la matriz el CI vive bajo el nombre; `.mat-column-ci`, `.cell-mono` y el ng-container `ci` removidos; `columnas = ['alumno','nota','clasificacion','accion']`). Nombre ahora en formato "Apellido Nombre" (consistente con la matriz y con la clave de orden).
- **Buffer de aire**: +4 → +12 (mismo que la matriz).
- **⚠️ Bug de medición con `flex:1`**: al darle `flex:1` a `.alumno-info`, el `.alumno-nombre` (block nowrap) se estira al ancho de la columna auto inicial. Con `table-layout: fixed` y 4 columnas auto, cada columna inicial = ~1/4 de la tabla (347px) > nombre más largo (192px) → `scrollWidth` medía el bloque estirado (274px) y la columna quedaba en 360px en vez de ~278. En la matriz no se notaba porque 8 columnas → 173px < 192px (scrollWidth = contenido). **Fix robusto**: nuevo util `core/utils/measure-text.ts` → `maxTextWidth()` (probe offscreen con el mismo font/weight/letterSpacing, `offsetWidth` del texto real). Usado en AMBOS componentes (`notas-edicion` y `docente-calificar`).
- Verificación render real (Cristian, `/docente/calificar/3`): ths = [Alumno 285, Nota 368, Clasificación 368, Acción 368], 7 filas, sin columna CI, nombre + CI texto en X=163 en todas las filas, `text-align:left`. Matriz admin intacta (270 / módulos y Prom 160 / anillos X=1395 / sin truncados). `npx tsc --noEmit` limpio. Screenshot `/tmp/opencode/col2.png`.

## Matriz de pagos por edición — cuotas por módulo + split automático (2026-08-08, SIN commit)

- **Pedido de Julio**: "pagos por edición como matriz espejo de notas", con una columna por módulo-cuota, columna Matrícula, anillo de % total, y que registrar un pago reparta el monto "a la cuota pendiente más próxima" sin obligar a elegir concepto. Beca perdida por reprobar módulo → cuotas a precio pleno.
- **Backend** (`PostgradoBackend`):
  - Migración `009_pago_detalle_programa_modulo.sql`: columna `pagos.id_detalle_programa_modulo FK` + matrícula legacy normalizada a 200 + backfill `Cuota N → dpm.orden=N`.
  - Migración `010_pagos_backfill_legacy_correcto.sql`: corrige el backfill — el concepto `Cuota N` NO equivale a `dpm.orden` (la ed 3 tiene DPMs con orden 4/5/6). Ahora las cuotas legacy se reparten cronológicamente (por id_pago) en ciclo entre los módulos de la edición del pago, en orden de `dpm.orden`.
  - `routers/pago.py` reescrito:
    - `GET /pagos/por-edicion/{id}` → matriz completa: `{precio, matricula, modulos[], alumnos[]}` con `matricula{pct,pagos}`, `cuotas[]` (esperado/pagado/pct/pagos), `otros{pagado,pagos}`, `total_esperado/pagado`, `pct_total`, `beca_activa`, `beca_motivo`, `descuento_aplicado`. Espejo estructural de `GET /notas/por-edicion`.
    - `_estado_financiero`: esperado por cuota = `precio * factor_desc / n_modulos` (factor 1.0 si `descuento_aplicado=0`; `(100-d)/100` si no; **beca_activa=false → factor 1.0**, motivada cuando la beca se pierde por reprobar el último módulo). Matrícula esperado = 200 o descuento. Pago confirmado de origen (historial_inscripcion → DPA origen → pagos por `id_modulo` con la edición destino) se suma a la cuota/matrícula del módulo equivalente y lleva `origen: {edicion, anio, semestre}`. `pendiente` NO suma.
    - `_planificar_cobro`: reparte el monto en orden [matrícula, módulos en orden desde el target (cíclico)] contra lo pendiente de cada bucket; el excedente se acumula en el último bucket.
    - `POST /pagos/` (crear): `PagoCreate` ganó `id_detalle_programa_modulo` (null = matrícula). Crea N pagos (uno por módulo alcanzado) con `concepto` "Matrícula"/"Cuota N" calculado, `db.commit()` por fin (antes los commits parciales quedaban sin persistir si el siguiente INSERT fallaba) y devuelve `{pagos: [...]}`. Misma lógica en `PATCH /pagos/{id}`.
  - Schemas: `schemas/pago.py` (`PagoResponse` ganó `id_detalle_programa_modulo`; `PagoCreate`/`PagoUpdate` también).
- **Frontend**:
  - `features/pagos/models/pago.model.ts`: +`PagoCreate/PagoResponse.id_detalle_programa_modulo`, y tipos de matriz `PagosEdicionData`, `AlumnoPagosMatrix`, `CuotaPagos`, `MatriculaPagos`, `OtrosPagos`, `PagoEntry`, `PagoOrigenEdicion`, `ModuloPagosInfo`. Eliminado `AlumnoPagos`.
  - `features/pagos/services/pago.service.ts`: `getPagosPorEdicion()` → `Observable<PagosEdicionData>`; `create()` → `Observable<{pagos: PagoResponse[]}>`.
  - `pagos-edicion.ts|html|css` reescritos como **tablero espejo de notas-edicion** con identidad verde (`--fich-feature-pagos` #16a34a): cabecera de 2 filas (Alumno rowspan2 sticky + "Cuotas por módulo" + Matrícula + Total), círculos de cuota, burbujas `pago-bubble-full/parcial/vacia` con monto pagado, anillo conic `%` con tooltip detallado (incluye `desde Ed. X` en pagos migrados), botón `+` por fila para registrar cuota, columna Alumno adaptativa (`maxTextWidth`, `measure-text.ts`), retirados colapsables, `table-layout: fixed`.
  - `pago-register-dialog.ts|html|css` reescrito: select destino (Matrícula + cuotas con "restante X Bs"), monto con **preview del reparto** (mismo orden que `_planificar_cobro`, excedente marcado ámbar), chips de resumen (total pagado/esperado, descuento, "Beca perdida" con motivo en tooltip), fecha + referencia + comprobante. Envía `concepto: 'auto'` (el backend lo recalcula).
- **Verificación**: `npx tsc --noEmit` limpio + `ng build` real OK (NG8002 inicial por falta de `MatTooltipModule` en el dialog → agregado). API: `GET /pagos/por-edicion/{3,4,5,6}` 200 con matemática correcta (Ana ed 3: 6×700 legacy + mat 200 → cuotas 1400/2000 y 71%; Sofía: pendiente no suma; Yomar 100% beca → solo 200 matrícula). Split real: POST 1200 → 550+550+100 (Cuota 1/2/3) y 200 a matrícula → "Matrícula 200". Path origen probado con historial sintético: pagos de la ed 3 (6×700 + 200) aparecen en ed 2 mapeados por `id_modulo` con `origen {edicion:3, anio:2026, semestre:1}` (registro temporal borrado). Login admin: `julio.toledo2030@gmail.com` / `adminjt` (rol 1), token en `/tmp/opencode/pagos_token.txt`, servidor test `uvicorn main:app --port 8001`.

## Matrícula configurable por edición + retoques a la matriz de pagos (2026-08-08, SIN commit)

- **Pedido de Julio**: campo en `programa_version_edicion` para el costo de la matrícula (cuota aparte del precio del programa) + más retoques a la tabla de pagos. También pidió **dejar de tocar la BD manualmente** — desde acá las verificaciones se hacen por API/build, la BD solo se toca aplicando migraciones (`psql -f migrations/...`).
- **Capa 1 (migración)**: `PostgradoBackend/migrations/011_pve_matricula.sql` — `ADD COLUMN programa_version_edicion.matricula DOUBLE PRECISION NOT NULL DEFAULT 0` + backfill `SET matricula = 200` en las ediciones existentes (consistente con la normalización 200 de la 009). Modelo: `matricula = Column(Float, nullable=True, default=0)`.
- **Capa 2 (backend)**:
  - `schemas/programa_version_edicion.py`: `matricula: float | None = None` en `ProgramaVersionEdicionBase` y `ProgramaVersionEdicionUpdate` + `validar_matricula` (>= 0). El `Response` la hereda de la Base.
  - `routers/pago.py`: **eliminada la constante `MATRICULA_MONTO = 200`** (y el import `Decimal`). `_estado_financiero(db, detalle, dpm_list, precio, matricula=0.0)` y `_planificar_cobro(..., matricula=0.0)` reciben el monto; `pagos_por_edicion` y `crear_pago` lo leen de `edicion.matricula` (fallback 0). El split a matrícula (`resto_mat`) usa el valor configurado, no 200 fijo.
- **Capa 3 (frontend)**:
  - `edicion.model.ts`: `matricula: number | null` en `ProgramaVersionEdicion` y `ProgramaVersionEdicionCreate`.
  - `edicion-form.ts`: control `matricula: [200, [Validators.min(0)]]` (default 200 para ediciones nuevas) + payload `matricula: raw.matricula ?? undefined`. `edicion-form.html`: campo "Matrícula (Bs)" junto a "Precio ($)" (hint "Cuota aparte del precio del programa"). Nota: precio sigue en USD, matrícula en Bs (convención existente de la matriz).
  - **Retoques `pagos-edicion`**:
    - **Mini barra de progreso** `.pago-track`/`.pago-track-fill` (3px, 46px) bajo cada burbuja de cuota y matrícula; fill verde, `parcial` ámbar, vacía vacía. `pctClamped()` (clamp 0-100).
    - **Chip de total bajo el anillo** `.total-chip` ("Bs X", píldora verde, espejo del prom-clasif de notas) con tooltip = `totalTooltip`. Retirados también lo muestran.
    - **Saldo a favor**: `bubbleClass()` devuelve `pago-bubble-sobre` (esmeralda oscuro #d1fae5/#065f46) cuando `pagado > esperado`; tooltips de cuota y matrícula agregan línea "Saldo a favor: X Bs" vía `conSaldo()`. `sobrePagado()`.
    - **Meta row**: `... · Matrícula {{ fmt(matriculaEdicion()) }} Bs` (nuevo `matriculaEdicion` computed sobre `data().matricula`).
- **Verificación**: `npx tsc --noEmit` limpio + `ng build --configuration development` OK (bundle completo). API (token `/tmp/opencode/pagos_token.txt`, uvicorn 8001): `GET /programa-version-edicion/` incluye `matricula: 200.0` en todas las pves; `GET /pagos/por-edicion/6` → `matricula: 200.0` top y `matricula.esperado: 200.0` por alumno. Sin probes SQL de test (solo la migración vía `psql -f`).
- ⚠️ Servidor de prueba 8001: arrancarlo con `setsid nohup venv/bin/python -m uvicorn main:app --port 8001 > /tmp/opencode/uvicorn_pagos.log 2>&1 < /dev/null &` — el patrón anterior (`(nohup ... &)`) dejó el proceso en el grupo del shell y se caía al terminar el comando.
- Archivos tocados: `PostgradoBackend/migrations/011_pve_matricula.sql`, `models/programa_version_edicion.py`, `schemas/programa_version_edicion.py`, `routers/pago.py`; `edicion.model.ts`, `edicion-form.ts|html`, `pagos-edicion.ts|html|css`.

## Celda de total sin chip + preview espejo del backend + pagos confirmados (2026-08-08, SIN commit)

- **Celda de total limpia** (`pagos-edicion.html|css`): eliminado el chip `.total-chip` ("Bs X") y el wrapper vertical `.total-wrap` de la columna Total — ahora la celda muestra solo el anillo de progreso con su tooltip (motivo: el chip se veía desparejo con el anillo). CSS: removidas `.total-chip` y sus reglas.
- **Preview del dialog es espejo exacto de `_planificar_cobro`** (`pago-register-dialog.ts`): antes el preview SIEMPRE ponía matrícula primero y hacía wrap-around del target; el backend solo cobra matrícula cuando el destino es matrícula (target null) y NO hace wrap (usa los buckets desde el target en adelante). Preview corregido: `cola = [matricula, ...orden]` solo si `target === null`; si no, `cola = orden.slice(idx)`. El excedente se acumula en el último bucket con `esUltimo` (ámbar). Verificado: con target cuota el preview ya no muestra "Matrícula".
- **CAUSA RAÍZ del "no guarda" resuelta** (`pago-register-dialog.ts`): el payload no enviaba `estado` → el backend default `pendiente`, y el %/"Pagado" de la matriz **solo suma `confirmado`** → al registrar el dialog cerraba pero el % no se movía (parecía que no guardaba; el pago quedaba visible en el tooltip como "(pendiente)"). Como no existe UI de confirmación de pagos, se decidió (con Julio) que el registro desde la matriz admin cree el pago **directamente `confirmado`**: el payload ahora manda `estado: 'confirmado'`. El dialog solo se usa desde `pagos-edicion` (admin), no afecta flujos de alumno.
- **Verificación render real** (Chromium headless, admin, `/pagos/6`): alineación ring/`+`/burbuja en la misma línea (delta Y = 0), tooltips de burbuja y botón OK, POST `/pagos/` 201 con `"estado":"confirmado"` y el anillo pasó de 65% → 71% tras registrar 400 Bs (burbuja cuota 1 = 1.100). `npx tsc --noEmit` limpio (el dev server 4200 recompiló los cambios). Pagos de prueba 74-77 rechazados vía PATCH por API tras cada probe (sin DELETE físico).
- Archivos tocados: `pagos-edicion.html|css`, `pago-register-dialog.ts`.

## REDISEÑO: Transcript "El recorrido del alumno" (2026-08-08, SIN commit)

- **Pedido de Julio**: el transcript multi-edición estaba "enredoso" (4 sistemas visuales que competían: fila de puntos + fila de notas + serpiente de progreso por cada edición, 3 colores de card origen/actual/resumen, leyenda aparte, labels de migración en las celdas). Concepto acordado con Julio: **"El recorrido del alumno"** — una sola historia visual de arriba hacia abajo con el lenguaje del tablero de notas (anillos, burbujas, píldoras, chips).
- **Nueva composición** (`transcript.html/css/ts` reescritos, se eliminó la lógica vieja de `snake*`/`filteredInscripcion`/`gridCols`/`modTypeClass`/`hasMigrations`):
  1. **Hero card** — avatar (iniciales, gradiente teal `--fich-feature-modulo` #0d9488), nombre + CI, pill de estado de la última inscripción, **anillo de promedio general** (conic vía `promRingBg()` + chip de clasificación `promClasifLabel()`, reusa `cal-*` con `--prom-color`), y `prom-ring-vacia` "—" si no hay promedio.
  2. **Banda de situación** (`situacion` computed) — una **oración generada** que responde "¿cómo va?": postulante ("aún no cursa módulos"), retirado, finalizado/graduado ("completó X de N módulos con un promedio de Y"), migración ("Viene de la Ed. X — aprobó A de N módulos que se migran; debe aprobar M1, M2, M3 y M6 en la Ed. Y"), en curso ("lleva X de N módulos aprobados; cursa el Módulo K"). Banda con gradiente teal + borde izquierdo acento.
  3. **Trayectoria** (solo si >1 inscripción) — strip horizontal compacto: nodo por edición (Ed. N, sem/año, pill de estado) unidos por flechas, nodo actual resaltado (gradiente teal).
  4. **Tablero de módulos** — un solo tablero basado en la **última inscripción** (6 tarjetas-módulo en grid `auto-fit minmax(150px,1fr)`): círculo número (`mod-num`, teal relleno solo si `aprobado()`), nombre (2 líneas + tooltip con `cellTooltip`), y estado: **burbuja de nota** (tintada por clasificación) con badge ámbar "de Ed. X" si es migrada, o chip **En curso** (teal con `pulse-dot` animado), **Incorporación** (saltado), **Pendiente** (punteado). Header con programa/edición + chip de migrados + barra de progreso teal "X de 6 · %".
  5. **Movimientos** — timeline existente, pulido (identidad teal, badge `tipo-transferencia` agregado, destino con tintes teal).
- **Helpers nuevos**: `aprobado(mod)` (nota ≥ 66), `modulosPendientes()` (orden de módulos sin nota aprobatoria), `fmtLista()` ("M1, M2, M3 y M6"), `currentModIdx()` (primer módulo sin nota ≥ modulo_inicio, excluye migradas; -1 si postulante/observado/retirado), `modEstado()` ('aprobado'|'migrada'|'en-curso'|'saltado'|'pendiente'), `progPct()`/`progLabel()`, `promRingBg()` (conic con `--prom-color`), `promClasifLabel()` (`CLASIF_LABELS`).
- **Pills de estado** sobre fondo blanco (antes estaban pensadas para header de gradiente): ahora fondos claros propios (postulante #fffbeb/#b45309, inscrito #eff6ff/#1d4ed8, incorporado #ede9fe/#6d28d9, finalizado/graduado #d1fae5, retirado #f1f5f9/#64748b).
- **Verificación**: `npx tsc --noEmit` limpio + `ng build --configuration development` OK. Render real Playwright/Chromium (login admin, port 4200, 4 casos): **Obi (38)** → hero "Viene de la Ed. 3 — aprobó 2 de 6 módulos que se migran; debe aprobar M1, M2, M3 y M6 en la Ed. 6.", trayectoria 2 nodos, tablero M1 EN CURSO, M2/M3 pendiente, M4[82]/M5[78]/M6[54] migradas con badge "de Ed. 3"; **Ana (39)** → "Finalizó en la Ed. 3 — completó 6 de 6 módulos con un promedio de 82."; **Luke (45)** → "Inscrito en la Ed. 3 — lleva 2 de 6 módulos aprobados." con M1-M3 Incorporación; **Julio (1)** → "Postulante en la Ed. 4 — aún no cursa módulos." todo pendiente + anillo "—". Geometría 1600px: 6 cards ~209px parejas; 1050px: wrap 5+1 sin overflow horizontal. Screenshots `/tmp/opencode/tra_{Obi,Ana,Luke,Julio}.png`.
- Archivos tocados: `transcript.ts`, `transcript.html`, `transcript.css`.

## REDISEÑO 2: Transcript hero → "Panel del recorrido" (2026-08-08, SIN commit)

- **Feedback de Julio**: el rediseño anterior del hero "no es muy gráfica" (avatar + anillo + banda de texto). Concepto aprobado: la primera parte pasa a ser **una gráfica del camino**, no texto.
- **Nuevo hero** (`transcript.html/css/ts`, reemplaza `hero-main`/`hero-ring`/`situacion-band`):
  1. **hero-top** — avatar + nombre/CI a la izquierda; a la derecha chip de edición actual `.hero-edicion` ("Ed. N · I/II año") + pill de estado `.estado-pill` (mismos mapas `estadoClass`/`estadoLabel`).
  2. **hero-body** — **donut de promedio** `.donut` (92px, conic `promRingBg()`, agujero vía `::before`, `donut-vacia` "—" sin promedio) + chip `prom-clasif`; a la derecha la **ruta de hitos** `.hero-ruta`: `ruta-track` (barra 8px) con `ruta-fill` (gradiente teal, width = `rutaFillPct()`) y `ruta-nodos` (grid, `rutaCols(n)` = `repeat(n,1fr)`), cada `.hito` 38px con `hitoClass()`:
     - `hito-ok` (teal relleno) = aprobado nativo · `hito-migrada` (ámbar #d97706 relleno) = aprobado migrado
     - `hito-reprobado` (rojo ahuecado) = nota < 66 · `hito-migrada.hito-reprobado` = migrada reprobada (agrega `hito-migdot` ámbar)
     - `hito-curso` (teal + animación `hitoPulse` de anillo) = en curso · `hito-saltado` (gris punteado) = incorporación · `hito-pend` (gris ahuecado)
     - Tooltip = `cellTooltip`. Hover escala 1.12.
  3. **hero-stats** — computed `stats()` → 4 tiles `.stat-tile` (Aprobados / En curso / Pendientes / Migrados) con icono en círculo tintado. `En curso` ⊂ Pendientes (un módulo sin aprobar que ya se está cursando cuenta en ambos; Aprobados + Pendientes = total de módulos).
  4. **hero-caption** — la oración `situacion()` queda como caption itálico al pie (`.hero-caption`, gradiente teal sutil). Si no hay inscripciones → `.hero-caption-solo`.
- **TS**: helpers nuevos `hitoClass()`, `lastAprobadoIdx()` (último índice aprobado, para rellenar hasta ahí cuando no hay en curso), `rutaFillPct(ins)` = `((idx+0.5)/n)*90`% (idx = en curso, o último aprobado; 0% sin avance), `rutaCols(n)`, `stats()`. **`modulosPendientes()` ahora excluye módulos saltados** (`modulo_orden >= modulo_inicio`) — afecta a Luke (pendientes = solo M6, antes 4). `modEstado()` se mantiene para el tablero de abajo.
- **Verificación**: `npx tsc --noEmit` limpio. ⚠️ La verificación por render real quedó **pendiente de hacer por Julio** (el dev server 4200 se congeló y se reinició en background: PID 20983/20997, log `/tmp/opencode/ngserve.log`; a las 02:24 aún compilando). Datos esperados por API (`/notas/transcript/{id}`, login 2 pasos: `/auth/login` → `/auth/seleccionar-rol`, rol 1): Obi(38) cursa M1, M4/M5 migradas aprobadas (82/78), M6 migrada reprobada (54); Ana(39) 6/6; Luke(45) incorporación M1-M3, M6 reprobada; Julio(1) postulante, sin notas.
- Archivos tocados: `transcript.ts`, `transcript.html`, `transcript.css`.
- **Fix de template (2026-08-08, mismo rediseño)**: `matTooltipPosition="top"` en los `.hito` rompía el compile de ngtsc (TS2322: `"top"` no es `TooltipPosition` válido en Material 21 → `'left'|'right'|'above'|'below'|'before'|'after'`). Corregido a `"above"`. Verificado con `ng build --configuration development` OK (tsc solo NO detecta errores de template — lección ya documentada). Sin restos del diseño previo (`filteredInscripcion`/`gridCols`/`modTypeClass`/`snake*`/`hasMigrations`) en HTML/CSS/TS. Dev server 4200 relanzado en background (pid 21636, log `/tmp/opencode/ngserve.log`) tras un `pkill` que se llevó también el server del usuario.

## Pulido transcript: chips en la oración + Recorrido/Resumen + "Estás acá" + trayectoria integrada (2026-08-08, SIN commit)

- **Pedido de Julio**: el hero del transcript ya es gráfico; faltaba pulir el texto y unificar la trayectoria. Cambios aplicados sobre el REDISEÑO 2:
- **A. Caption con datos destacados como chips** (`transcript.ts` + `transcript.html/css`): `situacion()` devuelve `partes: CaptionPart[]` (`{t, hi}`) en vez de `texto` plano. `interface CaptionPart { t: string; hi: boolean }` top-level. Los datos clave se marcan `hi=true` y se renderizan como `.cap-num` (píldora teal #0f766e sobre rgba(13,148,136,.1)). Ejemplos verificados: Obi(38) → "Viene de la **Ed. 3** — aprobó **2 de 6** módulos que se migran; debe aprobar **M1, M2, M3 y M6** en la **Ed. 6**." (4 chips); Ana(39) → "Finalizó en la **Ed. 3** — completó **6 de 6** módulos con un promedio de **82**." (3 chips, promedio solo si `promedio_general !== null`); Luke(45) → "Inscrito en la **Ed. 3** — lleva **2 de 6** módulos aprobados."; Julio(1) postulante → 1 chip. Se eliminó la itálica del caption (`.hero-caption` sin `font-style: italic`). Limpieza: se eliminó la variable muerta `partesCur` y el `if (!ins)` redundante (el caso sin inscripciones se cubre con `t.inscripciones.length === 0`; `lastInscripcion()!` no-null).
- **B. Micro-etiquetas de sección**: `.ruta-label` "Recorrido" sobre la ruta de hitos y `.stats-head`/`.stats-label` "Resumen" sobre los tiles (mismo lenguaje visual de `donut-label`: 10px uppercase letter-spacing .8px `--fich-text-faint`).
- **C. Marcador "Estás acá"** sobre el módulo en curso: `.hito-marker` (píldora teal con flechita `::before` hacia arriba) debajo del hito `hito-curso` (`@let hcl = hitoClass(mod, ins)` en el `@for` del `.ruta-nodos`; solo si `hcl === 'hito-curso'`, tooltip "Módulo en curso"). Debajo, no arriba, para no chocar con la barra del track ni con el header.
- **D. Trayectoria integrada en el hero** (se eliminó la tarjeta `.trayectoria` y todo su CSS `tray-*`): ahora el header de la ruta lleva `ruta-ediciones` — pills `.ed-pill` "Ed. N" (tooltip "Ed. N · I año — Estado" vía `semestreLabel`/`estadoLabel`) unidas por `.ed-arrow` `arrow_forward`; la última (`$last`) es `.ed-actual` (gradiente teal, es la edición actual) y cierra con `south` (`ed-arrow-down`) que "desemboca" en el track. Solo si `tieneTrayectoria()`.
- **Estructura del hero-body** (`.hero-ruta` pasa a `display:flex; flex-direction:column`): `.ruta-header` (label + ediciones) → `.ruta-stage` (position:relative, contiene `ruta-track` + `ruta-nodos`). `ruta-track` top ajustado de 23px → **19px** para centrar con los hitos (verificado: track center Y == todos los hitos center Y == 362).
- **Verificación**: `npx tsc --noEmit` limpio + `ng build --configuration development` OK (lección: tsc no detecta errores de template; siempre build real). Render Playwright/Chromium (login admin 2 pasos `julio.toledo2030@gmail.com`/`adminjt`): Obi(38) — header "Recorrido", pills [Ed. 3, Ed. 6 (actual)] + flechas [arrow_forward, south], 6 hitos con `hito-curso` en M1 y marker "Estás acá" (71×20px, bajo el hito), caption con 4 chips, "Resumen" + 4 tiles, sin `.trayectoria`, sin overflow horizontal, tooltip de pill "Ed. 3 · I 2026 — Incorporado"; Ana(39)/Luke(45)/Julio(1) sin marker (no hay en curso) y con los chips esperados. Screenshot `/tmp/opencode/tra_verif.png`.
- Archivos tocados: `transcript.ts`, `transcript.html`, `transcript.css`.

### Pulido de alineación (2026-08-08, mismo trabajo)

- **Julio**: "está algo descuadrado le hace falta un pulido". Diagnóstico por medición del DOM (no por captura): la columna de la ruta quedaba desplazada abajo respecto al donut — `align-items: center` centraba la columna corta (ruta) contra la alta (donut), dejando "Recorrido" 39px más abajo que "Promedio general" (y=311 vs 272) y los hitos 21px más abajo que el donut (centro 362 vs 341). Además las pills "Ed. N" terminaban en x=1441 y la flecha `south` en 1461, **más allá del track** (termina en 1403) — flotaban fuera del camino.
- **Fixes** (`transcript.css`): `.hero-body` → `align-items: flex-start` (columnas top-alineadas); `.ruta-header` `margin-bottom: 8px → 21px` (el stage baja lo justo para que los hitos centren en la línea del donut); `.ruta-ediciones` `margin-right: 4.5%` (las pills + `south` terminan en el borde derecho del track, ~x=1404).
- **Verificación render real**: donut y hitos centrados en y=341 (delta 0px a 1600 y 1200; Ana da 1px por redondeo de altura del header), "Recorrido"/"Promedio general" ambas en y=272, `south` right 1409 vs track right 1403 (6px de sobrevuelo intencional = "desemboca"), sin overflow horizontal, marcador 1 (solo Obi) y pills intactas.

## Historial del alumno: retiro en historial + módulo de inicio + bloque único (2026-08-09, SIN commit)

- **Pedido de Julio**: revisar la tabla `historial_inscripcion` (timeline "Historial de Movimientos" del transcript). Veredicto acordado: el retiro era el único movimiento significativo que NO se registraba (gap real), `modulo_inicio` ya venía en la API pero no se mostraba (gratis), y para self-movements el flow "Origen → Destino" duplicaba la misma edición (pulido UI). Transferencia = label muerto (el endpoint `transferir` ya no existe), se mantiene por compat con datos históricos.
- **1) Retiro registrado en historial** (backend):
  - Migración **`PostgradoBackend/migrations/012_historial_inscripcion_solicitud_nullable.sql`**: `historial_inscripcion.id_solicitud` pasa a **nullable** (el retiro no tiene solicitud asociada).
  - Modelo `models/historial_inscripcion.py`: `id_solicitud` `nullable=True`.
  - `routers/detalle_programa_alumno.py`: helper `_registrar_retiro(db, id_dpa)` crea `HistorialInscripcion(tipo='retiro', origen=destino=id, id_solicitud=None, motivo=None)`; llamado en `PATCH /{id}/retirar` (alumno) y en `DELETE /{id}` (soft delete admin → `retirado`).
- **2) `modulo_inicio` renderizado** (transcript.html/css): cada bloque Origen/Destino muestra `.ed-modulo` "Módulo de inicio: N" (dot teal 6px `::before`). Verificado: migración de Obi(38) → origen "Módulo de inicio: 4", destino "Módulo de inicio: 1".
- **3) Bloque único para self-movements**: helper `movimientoSelf(tr)` (origen.id_dpa == destino.id_dpa) → si es self, un solo bloque `.movimiento-edicion.solo` con label "Edición" (incorporación/reincorporación/retiro); la migración conserva el flow Origen → Destino con flecha.
- **Labels/dots de retiro**: `retiro` en `tipoMovimientoLabel` (transcript.ts) y `movimientoLabel` (revisar-incorporacion.ts); `.tipo-retiro` (rojo #fee2e2/#b91c1c) en transcript.css; `.dot-retiro` (#ef4444) en revisar-incorporacion.css.
- Archivos tocados: `PostgradoBackend/migrations/012_historial_inscripcion_solicitud_nullable.sql` (NUEVO), `PostgradoBackend/models/historial_inscripcion.py`, `PostgradoBackend/routers/detalle_programa_alumno.py`; `transcript.ts|html|css`, `revisar-incorporacion.ts|css`.
- Verificación: `venv/bin/python -c "import routers.detalle_programa_alumno"` OK; migración aplicada vía `psql -f`; `npx tsc --noEmit` limpio + `ng build --configuration development` OK. Render real (admin, `/transcript/6`): 4 movimientos, self → 1 bloque "Edición" + módulo de inicio + estado pill, badge "Retiro" rojo, motivo/solicitud intactos; `/transcript/38` migración → 2 bloques con módulo de inicio. Dato de prueba (retiro sintético con `id_solicitud NULL`) borrado por SQL tras la verificación. SIN commit.

## Boletas de pago: transacciones + anulación + transcript de pagos (2026-08-09, SIN commit)

- **Pedido de Julio**: el registro de pagos debía agruparse en "boletas" (una transacción con su comprobante y varias líneas de concepto), poder **anularse** con motivo (solo con permiso), y verse en un **transcript de pagos** por alumno con el desglose por concepto. Matrícula siempre primero en el reparto.
- **Capa 1 — migraciones backend** (`PostgradoBackend/migrations/013_pagos_transaccion.sql`, aplicada):
  - Tabla **`transaccion_pago`**: `id_transaccion`, `id_detalle_programa_alumno FK`, `monto_total`, `fecha_pago`, `estado` (`pendiente|confirmado|anulado`), `comprobante` (path base64), `motivo_anulacion`, `anulado_fecha`, `anulado_por_id_usuario`, `creado_por_id_usuario`.
  - `pagos` pierde `comprobante_url`/`numero_referencia`/`estado` y gana `id_transaccion FK` (nullable, se backfilleó). Backfill: 1 transacción por pago existente → 69 transacciones/69 pagos, 0 huérfanos, sumas = 42800.00.
- **Capa 2 — backend** (`routers/pago.py`, `schemas/pago.py`):
  - `GET /pagos/mis-pagos/{id}` → `{transacciones, total_pagado}`; exige ser el alumno (`es_alumno_actual`), admin NO la ve.
  - `POST /pagos/preview` → `{asignaciones:[{tipo:'matricula'|'cuota', concepto, monto}]}` — `TransaccionPagoCreate` exige `fecha_pago`; reparte [matrícula, cuotas en orden desde el target]; sobrante se acumula en el último bucket. Matrícula-first confirmado (250 → Matrícula 200 + Cuota 1 50).
  - `POST /pagos/` → guard propio "No podés registrar pagos para tu propia inscripción" (403); crea transacción + filas; `estado: 'confirmado'` (sin UI de confirmación de pagos; el registro admin es directo).
  - `PATCH /pagos/transacciones/{id}/anular` → permiso `pagos.anular` (403 para alumno); revierte totales (mis-pagos 450→250; por-edicion refleja la baja).
  - `GET /pagos/transcript/{id_alumno}` → `{inscripciones:[{programa_nombre, edicion_*, total_pagado, transacciones:[{estado, motivo_anulacion, anulado_fecha, asignaciones:[{concepto, monto}]}]}]}`. Acceso admin (`pagos.ver`) o el propio alumno. **Bugfix**: el campo del modelo es `programa.nombre_programa` (no `nombre`).
  - `seed.py`: `pagos.anular` agregado (lista + descripción); permiso insertado y otorgado a `adm_informatico` + `adm_director`.
- **Capa 3 — frontend**:
  - `pago.model.ts`: `TransaccionPagoResponse`, `PagoItemResponse`, `TransaccionPagoCreate`, `TransaccionPagoBaja`, `PreviewAsignacion/PreviewResponse`, `MisPagosResponse` (`transacciones`+`total_pagado`), `TranscriptPagosResponse`/`TransaccionTranscript`/`TranscriptPagosInscripcion`; `PagoEntry` con `id_transaccion/concepto/estado/comprobante`.
  - `pago.service.ts`: `preview()`, `create()` → `TransaccionPagoResponse`, `anular()`, `getTranscriptPagos()`; eliminado `update()` (sin callers).
  - `pago-register-dialog.*` reescrito: destino (Matrícula explícita + cuotas), preview real del backend, comprobante base64 obligatorio (JPG/PNG/WebP/PDF ≤10MB), **dialog de sobrante** via `ConfirmDialogComponent` compartido (`{titulo, mensaje}`) solo cuando `previewAsig.length > 1`.
  - `boletas-alumno-dialog.*` (NUEVO): transacciones del alumno filtradas por dpa, badges de estado, link comprobante (`environment.apiUrl`), botón "Anular boleta" cuando `estado==='confirmado' && hasPermiso('pagos.anular')`; recarga matriz al cerrar.
  - `anular-boleta-dialog.*` (NUEVO): motivo obligatorio (snackbar si vacío), llama `service.anular`, cierra con `true`.
  - `pagos-edicion.*`: método `verBoletas()` + botón `receipt_long` en columna Total.
  - **Transcript**: sección "Pagos del alumno" en `transcript.html/css/ts` — por inscripción: programa/edición, total confirmado, lista de transacciones con pill Confirmado/Anulado, desglose por concepto, nota roja de anulación con motivo/fecha. Helpers `fechaPago()`, `fmt()`, signal `pagosData` + `loadPagos()` (llama `getTranscriptPagos` en `loadTranscript`).
- **⚠️ Decisión (2026-08-09)**: el transcript NO etiqueta "sobrante" — el helper `pagoSobrante()` (suma de asig > 1) se descartó porque **malrotulaba pagos parciales normales** (ej. 250 → Matrícula 200 + Cuota 1 50 mostraba "sobrante de 50"). El desglose exacto por concepto ES el valor del transcript; el sobrante real (excedente sobre el total pendiente) ya se confirma en el dialog de registro al momento de pagar. Un flag de sobrante histórico requeriría replay en backend (`_planificar_cobro` no persiste el plan).
- **Verificación**: `npx tsc --noEmit` limpio + `ng build --configuration development` OK + render Playwright/Chromium real (admin `julio.toledo2030@gmail.com`/`adminjt`, puerto 4200): `/pagos/6` → boletas dialog con 7 boletas y 7 "Anular boleta"; registro con comprobante PNG → preview 5000 = Matrícula 400 + Cuotas + sobrante 3000 en Cuota 6 + ConfirmDialog de sobrante (cancel → sin cambios en BD, sigue 71/72 filas); dialog anular con motivo (sin mutar); `/transcript/6` → 1 inscripción, 2 transacciones (1 anulada con motivo), desglose "Matrícula 200 | Cuota 1 50 | Cuota 1 200". BD intacta tras las probes (no se crearon pagos).

## inscripcion-detail: KPI strip + cards "Mis Notas" y "Mis Pagos" (2026-08-09, SIN commit)

- **Pedido de Julio**: el detalle de inscripción del alumno tenía la info distribuida pero no mostraba un resumen académico/financiero en contexto. Se agregó un **KPI strip** de 4 tiles arriba del `detail-grid` (Estado con color de estado + sub de edición, Promedio general con anillo/clasificación, Documentación con `aceptados/total` + barra, Pagos con `Bs pagado` + barra de `%` sobre el esperado) y dos cards nuevas en la main-col: **"Mis Notas"** y **"Mis Pagos"**.
- **Fuente de datos**: ya no se consultan endpoints dedicados — se reusan los transcript existentes filtrando por el DPA actual:
  - `_cargarNotasYPagos(idDpa)` llama `InscripcionEdicionService.getTranscript(idAlumno)` y `PagoService.getTranscriptPagos(idAlumno)` (ambos requieren ser el alumno; `idAlumno` sale de `auth.user().id_profile` cuando `profile_type === 'alumno'`). Los resultados se matchean por `id_detalle_programa_alumno === idDpa` → `misNotas`/`misPagos`. Señales: `misNotas`, `misPagos`, `cargandoNotas/Pagos`, `errorNotas/Pagos` (estados loading/error/vacío en ambas cards).
- **Card "Mis Notas"** (`notas-card`): grid de módulos (`.mod-card` con `.mod-num` relleno si `aprobado()` ≥ 66, nombre con tooltip, burbuja `.nota-bubble` tintada por clasificación o `.vacia` punteada "—") + `.promedio-box` con `.promedio-ring` (conic `promRingBg()`) + chip de clasificación (`promLabel()`/`promColor()`). Helpers nuevos: `notaDe()` (entero `Math.floor(n+0.5)`), `notaClase()`/`notaLabel()` (vía `clasificarNota` + `CLASIF_LABELS`), `aprobado()`, `aprobadosCount()`, `promedioRedondo()`, `promClasifKey()`, `promLabel()`, `promColor()`, `promRingBg()`. `CLASIF_LABELS`/`CLASIF_COLOR` mapean `cal-*` → label/hex (misma paleta del transcript: sobresaliente #4338ca, distinguido #047857, bueno #0369a1, suficiente #b45309, insuficiente #b91c1c, abandono #64748b).
- **Card "Mis Pagos"** (`pagos-card`): bloque `.financiero` (total pagado/esperado con barra `.fin-bar total`, chip de % (`fin.pct`) que se vuelve `fin-pct-ok` verde ≥100, filas de Matrícula/Cuotas/Otros con barras tintadas, `.fin-saldo` "Pendiente de pago" o "Saldo a favor" si `saldo < 0` via `saldoAFavor()`, chip de descuento si `descuento_aplicado > 0 && beca_activa`, `.fin-beca-note` ámbar si la beca se perdió con `beca_motivo`) + listado de **boletas** (`boletas-header` con count, `.boleta-item` por transacción con fecha/monto/pill de estado/comprobante linkeado a `apiUrl` + desglose por concepto con monto + nota roja de anulación con motivo/fecha). Helpers: `transaccionEstadoLabel()`, `fmt()` (`es-BO`), `fechaPago()` (parsea ISO sin `T` con `T12:00:00`), `pctBar()`.
- **Pulido del portal/lista (misma sesión)**: `alumno-portal` `.portal-shell` a `width:90% / max-width:1560px` (estándar de anchado); `inscripciones` (lista) — chips de estado con `estadoLabel()` capitalizado, `detail-row` → `detail-item` (removidos los ítems redundantes "Tipo Descuento"/"Documentación"), y documentación como `.docs-block` con barra de progreso (`docsPct()`).
- **⚠️ Exploración no implementada**: se evaluó separar el main-col del detalle en **tabs** (Recorrido/Notas/Pagos/Documentación/Solicitudes, patrón `gestionar-requisitos-incorporacion`) para acortar la página — quedó **descartada por ahora**, el estado actual es cards apiladas + KPI strip. Si Julio la pide, retomar esa refactorización.
- Archivos tocados: `inscripcion-detail.ts|html|css`, `alumno-portal.ts`, `inscripciones.ts|html|css`.
- Verificación: `ng build --configuration development` OK (no tsc solo — lección documentada). SIN commit.
