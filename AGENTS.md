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