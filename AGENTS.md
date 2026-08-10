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
9. **Contexto siempre actualizado** — después de cada cambio se actualiza AGENTS.md (qué, archivos, estado del roadmap). Si hay cambios sin commit, se registran igual para poder retomar ante un corte.

## Contexto del proyecto

- Stack: **Angular 21** (standalone, Material M3, Signals + RxJS) + **FastAPI** + SQLAlchemy + PostgreSQL
- Backend: `github.com/Julio7-7-7/PostgradoBackend` (repo separado de este frontend)
- Nombre del usuario: **Julio** (no "julius" — eso es solo el system user)

## Entornos (local vs Supabase)

- `DATABASE_URL` única en `database.py` (línea 8): `APP_ENV` no definida/`local` → `.env` (Postgres local); `APP_ENV=production` → `.env.prod` (Supabase, puerto 5432 session pooler + `?sslmode=require`).
- **BD NO se toca manualmente salvo aplicar migraciones**: `psql -f migrations/XXX.sql` (construcciones/ediciones de prueba sí vía SQL, y se limpian al terminar). No crear `DELETE` físicos (ver reglas).
- Árbol alembic local está roto pre-existente → los cambios de schema se aplican como migración SQL, no con alembic.
- Servidor de test: `setsid nohup venv/bin/python -m uvicorn main:app --port 8001 > /tmp/opencode/uvicorn.log 2>&1 < /dev/null &` (el patrón `(nohup &)` se caía al terminar el comando).

## Patrones del sistema (REGLAS — no violar)

- **NO HAY DELETE FÍSICOS** — no usar endpoints `DELETE`. Soft delete vía `PATCH` con `estado: 'inactivo'` (o equivalente). Catálogos (programas, docentes, requisitos, etc.) usan soft delete; tablas transaccionales (notas, pagos, inscripciones) solo se crean/editan/anulan, nunca se borran. No crear botones de eliminar.
- **Anular con motivo** (pagos): `PATCH /pagos/transacciones/{id}/anular` con permiso `pagos.anular`, registra `motivo_anulacion`/`anulado_fecha`/`anulado_por_id_usuario`.
- **Collapsible inactive** — listas muestran activos por defecto + sección colapsable "Inactivos (N)" con chevron animado. No tabs activos/inactivos.
- **Soft delete pattern** — Backend: `PATCH /{id}/cambiar-estado` con `estado: 'activo'|'inactivo'`. Frontend: toggle con `ConfirmDialog`.
- **Signals first** — estado con `signal()`, derivaciones con `computed()`, efectos con `effect()`. Un `computed()` NO trackea escrituras sobre objetos planos → las colecciones de selección deben ser `signal<number[]>` (lección de usuario-form).
- **Standalone components** — todos standalone, sin NgModule. **Feature modules** — cada feature bajo `features/`: models/, services/, pages/, routes/.
- **Upload pattern** — Base64 → `/media/`, reusar `guardar_documento_base64()`/`guardar_foto_base64()` de `routers/utils.py`. Max 10MB, MIME validado por magic bytes. **Document URLs** siempre prefijadas con `environment.apiUrl`.
- **Commit pattern (backend)** — `flush()` → helpers de sync → un solo `commit()` (nunca double/triple commit).
- **Nota classification** — unificada al enum backend `NotaCalificacion`; frontend usa `clasificarNota()` de `core/utils/nota-utils.ts` (devuelve claves `cal-*`).
- **Rounding** — backend `redondear_nota()` = `math.floor(nota + 0.5)`; frontend `Math.floor(n + 0.5)`. Notas siempre enteras en pantalla.
- **Regla de futuro-only** — la configuración admin de requisitos (`solicitud_requisito`, `modalidad_requisito`) solo aplica a **creaciones futuras**; nunca resincronizar solicitudes/inscripciones existentes contra la config actual.
- **No crear FKs redundantes** — si la info se puede derivar de otra tabla, no duplicar.

## Guías de diseño

- `DESIGN.md` — identidad visual: azul FICH (#1e3a8a), sin glassmorphism, sin bordered-left, sombras parcas, croma mínimo.
- `PRODUCT.md` — institucional moderno, anti-template genérico, animaciones con propósito (<300ms), estados vacío/loading/error obligatorios.

## Feature colors system (`material-theme.scss`)

| Feature | Color | Light |
|---|---|---|
| programa | `#1e3a8a` | `#eef2ff` |
| tipo-programa | `#7c3aed` | `#f5f3ff` |
| docente | `#0d9488` | `#f0fdfa` |
| contratacion | `#d97706` | `#fffbeb` |
| alumno | `#0891b2` | `#ecfeff` |
| edicion | `#4f46e5` | `#eef2ff` |
| modulo | `#0d9488` | `#f0fdfa` |
| home | `#1e3a8a` | — |
| requisitos | `#0d9488` | `#f0fdfa` |
| modalidades | `#059669` | `#ecfdf5` |
| descuentos | `#b45309` | `#fffbeb` |
| documentacion | `#0284c7` | `#f0f9ff` |
| inscripciones | `#4f46e5` | `#eef2ff` |
| pagos | `#16a34a` | `#f0fdf4` |
| notas | `#9333ea` | `#faf5ff` |
| solicitudes | `#2563eb` | `#eff6ff` |
| roles | `#7c3aed` | `#f5f3ff` |
| usuarios | `#0ea5e9` | `#f0f9ff` |

## Módulos del frontend

- **detalle-programa-modulo**: `detalle-list` (abanico de módulos, horarios inline, Historial / Cuadro Horario / Gestionar), `detalle-gestionar` (estado, fechas, horarios CRUD con pendingActions), `detalle-form`.
- **horario-dialog** (`features/horario/components`): chips multi-select de días + reloj analógico; multi-día y edición con día fijo.
- **cuadro-horario-dialog** (`shared/components`): calendario mensual estilo Google Calendar; solo desde `detalle-list`.
- **date-utils** (`core/utils`): `aDate(iso)` (parseo local sin bug de timezone), `aFechaDisplay`, `aFechaString`, `isoAString`. Para timestamps ISO completos (`created_at`) NO usar `+ 'T00:00:00'` (invalida el parseo) — formatear con `new Date(iso)` directo.
- **measure-text** (`core/utils/measure-text.ts`): `maxTextWidth(elements)` — ancho de columna alumno adaptativo (probe offscreen con el mismo font). **sort-utils** (`core/utils/sort-utils.ts`): `sortItems(items, keyAccessor, dir)` null-safe con `localeCompare('es')`.
- **home** (dashboard): header con fecha, stats clickeables, carrusel "Oferta Académica", "Acceso Directo".

## Decisiones de diseño clave

### Auth + RBAC
- Login con correo+contraseña (no CI/pasaporte); 2 pasos (credentials → seleccionar rol → JWT). JWT claims: `id_usuario`, `id_rol`, `id_profile`, `email`, `permisos[]`.
- Admin que también es estudiante → misma cuenta con múltiples roles (`usuario_roles`).
- **Rol base por `tipo_persona` al alta** (2026-08-09, password autogen = CI): `alumno` → rol alumno (+ perfil Alumno); `docente` → rol docente (+ perfil Docente); `administrativo` → los 5 roles admin (adm_informatico/legal/contable/director/pasante + perfil Administrativo). Ya NO toda cuenta lleva rol alumno.
- `administrativos` es una sola tabla (no por cargo): legal/contable/director/pasante difieren por permisos vía rol. Sin `programa_usuario`: cada rol admin ve TODOS los programas.
- Password inicial = CI (`must_change_password=True`); `PATCH /auth/cambiar-password` salta verificación de password actual cuando el flag está activo. Login step `cambio` fuerza el cambio en el primer ingreso.
- `usuarios.py::crear_usuario` **vincula un Docente existente por correo** en vez de duplicarlo (bugfix: portal docente vacío por docente duplicado). `POST /docentes/` también auto-crea/víncula la cuenta de acceso.
- Protección: no desactivar al único `adm_informatico` activo.
- Registro público (`POST /auth/registro`): crea el alumno completo de una vez (wizard 3 pasos Cuenta/Identidad/Contacto); valida CI o pasaporte.

### Junction tables M:N
- `modalidad_requisito` (requisitos por modalidad), `modalidad_tipo_descuento` (descuentos por modalidad), `tipo_descuento_requisito` (docs por descuento), `modalidad_tipo_programa` (modalidades por tipo), `solicitud_requisito` (docs de solicitud por `id_tipo_solicitud` FK: 1 incorporación / 2 migración / 3 reincorporación).

### Flujo de control_documentacion
1. Alumno elige modalidad → se generan registros por cada requisito de esa modalidad.
2. Elige descuento → backend verifica `modalidad_tipo_descuento`; si aplica → `control_documentacion` extra (obligatorio) con requisitos del descuento.
3. Admin checkea: pendiente → entregado → aprobado/rechazado.

### Estados del alumno en inscripción
`postulante → observado → inscrito → incorporado → finalizado → graduado` (también `retirado`). `retirado → postulante` permitido. `TRANSICIONES_ESTADO` validado en backend, estricto. Retirados excluidos del transcript (colapsables en notas-edicion).

### Notas
- `ESTADOS_CON_CALIFICACION`: `{inscrito, incorporado, finalizado, graduado}`.
- Unique `uq_nota_alumno_modulo` en `(id_detalle_programa_alumno, id_detalle_programa_modulo)`.
- **Módulo fuera de `en_curso` = solo lectura** (UI y backend).
- Dialog `NotaDialog` (crear con buscador/editar, patrón `pago-register-dialog`): nota entera, preview de clasificación, Enter guarda. `NotaDialogData` interface.
- `clasificarNota` thresholds: suficiente 66; paleta unificada en los tableros.

### Cross-edition enrollment
- `historial_inscripcion` columna vertebral: `tipo_movimiento` = `transferencia|incorporacion|reincorporacion|retiro`, `id_solicitud` nullable (el retiro no tiene solicitud). El **retiro se registra** en `PATCH /{id}/retirar` y en el soft-delete admin.
- Flujo incorporación invertido: alumno inscribe primero (DPA `postulante`, `es_incorporacion=true`) + Solicitud `pendiente`; migración = solo Solicitud (sin DPA). Transferir (endpoint viejo) ya NO existe.
- Aprobar: incorporación → DPA `postulante`; migración → DPA directo `inscrito`; reincorporación → reactiva como `inscrito` en la misma edición conservando notas/pagos/docs. `id_modulo_inicio` solo se reasigna si el admin lo envía.
- Transcript se construye con `notas` + `detalle_programa_modulo` + `detalle_programa_alumno` — sin tabla intermedia (se eliminó `avance_modulo`).
- `GET /solicitud/{id}/destinos-recomendados` — ranking por afinidad (módulos pendientes sin nota aprobatoria comparados por `id_modulo`); sort `(-aprovechables, -afinidad, -cupo, -fecha, -precio, -id)`; nunca `finalizado` como destino. `preview-migracion` compara origen/destino.
- `solicitud_documento` junction (solicitud → requisito con URL/estado individuales); `documento_solicitud.fecha_entrega` nullable; estado intermedio `entregado` al subir.

### Pagos
- **Boletas/transacciones**: `transaccion_pago` (monto_total, fecha, estado `pendiente|confirmado|anulado`, comprobante, motivo_anulacion, anulado_*). `pagos` pierde comprobante/estado propio y gana `id_transaccion` FK.
- Registro desde la matriz admin crea la transacción **`confirmado`** directo (no hay UI de confirmación).
- Split `_planificar_cobro`: reparte [matrícula, cuotas en orden desde el target]; sobrante se acumula en el último bucket. `POST /pagos/preview` devuelve el plan (espejo en el dialog). Matrícula siempre primero.
- Matrícula configurable por edición (`programa_version_edicion.matricula`); precio en USD, matrícula en Bs.
- `GET /pagos/mis-pagos/{id}` (solo el propio alumno) y `GET /pagos/transcript/{id_alumno}`. El campo del modelo es `programa.nombre_programa`.

### Reordenar módulos (`PATCH reordenar` en detalle_programa_modulo)
- **Fechas ancladas a la posición (slot)**: al reordenar cada módulo hereda las fechas del puesto donde cae. Clamp anti-pasado a hoy + duración ≥30. No marca `finalizado` automáticamente (no llama `actualizar_estado_auto`).
- Validación **por módulo movido**: `en_curso`/`finalizado` no pueden cambiar de posición; un finalizado anclado NO bloquea reordenar los demás.

### Routing/Nav
- **`core/config/nav.config.ts` = fuente única** (`NAV_ITEMS` 16 ítems con path/label/icon/feature/permiso/group + `NavItem` con `kind`); `nav-routes.ts::buildNavRoutes()` genera rutas top-level planas. Agregar feature/permiso = tocar un solo lugar.
- Rutas planas (sin shell admin): `/estudiantes` = lista admin de alumnos; `/alumnos` = portal estudiante; `/docente` = portal docente vs `/docentes` = CRUD admin; `/solicitudes/:idSolicitud/revisar`; `/requisitos-incorporacion`. Catch-all `**` → `''`.
- Portal docente: `idDocente` desde `auth.user().id_profile` (no de la URL). Login docente → `/docente/mis-modulos`.

## Patrones UI del sistema (tablero)

Lenguaje visual consolidado (lo aprobado por Julio iterativamente):
- **Tableros**: contenedores radius 14-18px, gradiente sutil + resplandor del color de feature, `--fich-shadow-sm`, headers con banda `linear-gradient(180deg, light, transparent)` + hairline `#e9edf4`.
- **Elementos**: círculos de módulo `.th-num`, **burbujas de nota** `.nota-bubble` (píldoras tintadas por clasificación, `tabular-nums`, vacías = punteadas "—"), **anillos de progreso** (conic-gradient + agujero `::before`), **chips/píldoras** tintados, **avatares de iniciales** con gradiente del color de feature, leyenda de clasificación.
- **Tablas**: `table-layout: fixed`, columna Alumno adaptativa (`maxTextWidth`), cabecera de 2 filas agrupada, hover pinta la fila completa, hairline entre filas.
- **Paleta clasificación**: sobresaliente #4338ca/#eef2ff, distinguido #047857/#ecfdf5, bueno #0369a1/#eff6ff, suficiente #b45309/#fffbeb, insuficiente #b91c1c/#fef2f2, abandono #64748b/#f1f5f9.
- **Anchado**: contenedores de página `width: 90%` + `max-width` por tipo — listas/dashboards 1560-1920px, formularios/gestión 1240-1440px, tablas de gestión ~1440px. `.page-container { padding: var(--fich-space-lg); width: 90%; margin: 0 auto; }`.
- **Paginación**: barra con rango + controles + "N por pág." (perPageOptions [10,20,50,100]); filtros client-side con `allItems` + chips clickeables cuando el backend permite cargar todo (patrón inscripciones-edicion).
- **Reglas de UI**: nombres "Apellido Nombre" sin coma; badges sin prefijo `cal-` en tableros; sort con cabeceras clickeables (`sortItems`) o toggle A-Z/Z-A en cards.

## Regla: página vs diálogo (CRUD)

- **Forms simples (≤ 4-6 campos, una sola pantalla) → `dialog`** vía `MatDialog` desde la lista (patrón: `abrirFormulario(registro?)` en la lista, `MAT_DIALOG_DATA` + `MatDialogRef` en el form, `dialogRef.close(true)` en guardar y la lista recarga si el resultado es truthy). Shell del dialog: `.dialog-header` con `.header-icon` (gradiente del feature color) + `mat-dialog-content` + `mat-dialog-actions align="end"`; el form NO se registra en rutas.
- **Wizards / flujos multi-paso o complejos → página** con ruta propia. Ejemplo: `usuario-form` (wizard Tipo→Datos→Roles→credenciales) vive en `/usuarios/nuevo`.
- **Carga masiva o pantallas especiales → página** con ruta propia (ej: `modulo-batch` en `/versiones/:versionId/modulos/masiva`), nunca en la ruta `nuevo`.
- Conversión hecha 2026-08-09: tipo-programa-form, programa-version-form, programa-form y modulo-form pasaron de página a dialog; usuario-form pasó de dialog a página.

## Lecciones de trabajo y verificación (CRÍTICAS)

- **`npx tsc --noEmit` NO detecta errores del compilador Angular (ngtsc)** ni de template. SIEMPRE verificar con `ng build --configuration development` (o el dev server recompilando). (Varias veces el "compila" engañó.)
- Template gotchas: `matTooltipPosition` usa `'above'` (no `"top"`), `mat-icon-button` dentro de `@if/@else` envuelto en `<ng-container>`, `viewChild` con locator string necesita `{ read: ElementRef }`, propiedades usadas solo en template no deben ser `private`.
- **Dev server**: puerto 4200. Si algo del frontend se ve "viejo", revisar `/tmp/opencode/ngserve.log`; reiniciar con `nohup npx ng serve --port 4200 > /tmp/opencode/ngserve.log 2>&1 &`.
- **Render real (Playwright)**: browser en `~/.cache/ms-playwright/chromium-1234`, playwright en `~/.npm/_npx/e41f203b7505f1fb/node_modules`. Launch con `executablePath: '.../chrome-linux64/chrome'`. Login admin: `julio.toledo2030@gmail.com` / `adminjt` → selector de perfil "Administrador". Verificar medidas del DOM (boundingBox, getComputedStyle) más que capturas.
- **BD local**: `PGPASSWORD=adminjt psql -h localhost -U julius -d postgrado`. Datos de prueba se crean y limpian por SQL; los pagos de prueba se rechazan/anulan por API (no DELETE físico).

## Archivos relevantes

- `~/Programación/Postgrado-Frontend/` — proyecto Angular
- `~/Programación/Postgrado-Frontend/src/material-theme.scss` — tema Material + feature colors
- `~/Programación/Postgrado-Frontend/src/styles.css` — estilos globales (`.btn-nuevo`, `.btn-guardar` con fix de stacking de labels)
- `~/Programación/PostgradoBackend/` — proyecto FastAPI
- `~/Programación/PostgradoBackend/routers/utils.py` — uploads (base64 → media/)
- `~/Programación/PostgradoBackend/models/`, `schemas/`, `migrations/` (aplicar con `psql -f`)
- `~/Programación/open-design/` — herramienta de diseño AI (daemon: `node apps/daemon/bin/od.mjs --port <puerto> --no-open`; `pnpm tools-dev` no funciona)

## Pendientes

- **Refinar contraste y diferenciación visual general**
- **Subida de documentos por parte del alumno** — funcionalidad completa (subir archivo al servidor, no solo ver requisitos)
- **Matriz visual rol × permiso** (opcional, postergable)

## Historial de decisiones por feature (resumen durable, más reciente arriba)

- **Modelo independiente `transaccion_pago` (2026-08-10)**: `TransaccionPago` deja de vivir en `models/pago.py` y pasa a `models/transaccion_pago.py`; sus schemas a `schemas/transaccion_pago.py` (`TransaccionPagoCreate`, `TransaccionPagoBaja`, `TransaccionPagoResponse`, que importa `PagoItemResponse` de `schemas.pago`) y sus endpoints a `routers/transaccion_pago.py` (`POST /pagos/`, `GET /pagos/mis-pagos/{id}`, `PATCH /pagos/transacciones/{id}/anular`, `GET /pagos/{id}`; tag "Pagos · Transacciones"). `routers/pago.py` queda con la matriz/transcript/preview (tag "Pagos"). Comunicación por imports: `routers.transaccion_pago` importa `_cargar_movimientos`, `_planificar_cobro`, `_serializar_pago` desde `routers.pago`; `models.pago` importa `TransaccionPago` desde `models.transaccion_pago`; `schemas.transaccion_pago` importa de `schemas.pago`. URLs/respuestas sin cambios (frontend intocado). Bugfix latente: `dashboard.py::stats` usaba `Pago.estado` (dropeado en 013) → ahora cuenta con JOIN a `transaccion_pago` filtrando `TransaccionPago.estado == 'confirmado'`. Verificado: backend en 8001 (todos los endpoints pagos 200/201/400-esperado, dashboard/stats 200) + `ng build` sin cambios frontend.
- **Pagos: simplificación de `pagos` (2026-08-10)**: eliminados de `pagos` los campos redundantes `fecha_pago` (vive en `transaccion_pago`), `observaciones` (muerto; la UI siempre enviaba null) e `id_detalle_programa_alumno` (denormalizado; el DPA se resuelve con JOIN a `transaccion_pago`). `pagos` queda como líneas de asignación puras (`monto`, `concepto`, `id_detalle_programa_modulo`, `id_transaccion`, timestamps). Backend: `_cargar_movimientos` hace JOIN con `TransaccionPago` (filtra por `TransaccionPago.id_detalle_programa_alumno`); `_entry`/`_serializar_pago`/`crear_pago` sin los campos; `TransaccionPagoCreate` y `PagoItemResponse` limpios (frontend: `pago.model.ts` y `pago-register-dialog.ts` sin `observaciones`). Bugfix latente en `preview-migracion` (`routers/solicitud.py`): `p.estado`/`p.fecha_pago` de Pago nunca existieron → ahora se leen de la transacción (`t.estado`/`t.fecha_pago`) con filtro `confirmado` (antes `aprobado`). Migración `014_pagos_simplificar.sql`. Verificado: backend en 8001 (preview / create / transcript / por-edicion / anular / preview-migracion → 200) + `ng build --configuration development` OK.
- **Upload-box global (2026-08-09)**: componente compartido `UploadBoxComponent` (`shared/components/upload-box/`, selector `app-upload-box`) para TODAS las subidas de documentación — cuadrito fino verde (drag o tocar), al elegir archivo muestra **Subir/Cancelar**. API: inputs `accept`, `disabled`, `file: File|null`, `fileName`, `fileSize`, `label`, `hint`, `confirmText` (default "Subir"), `showConfirmButtons` (default true), `uploading`, `uploadDone`, `uploadLabel`; outputs `picked(File)`, `confirm()`, `cancel()`, `remove()`. Los padres conservan validación (máx 10 MB, MIME) y los handlers cambian de `(event: Event)` a `(file: File)`. Integrado en `inscribir` (1 box), `inscripcion-detail` (6 boxes: reinc-req/migr-req en selección pura, reinc-docs/obligatorios/extras en confirm), `contratacion-detalle` (2: activo + reemplazo, `disabled` con `pasosBloqueados()` y mientras se sube), `pago-register-dialog` (1, selección pura con `showConfirmButtons=false`; la señal `comprobanteFile` conserva el File real para el box). Fotos de catálogo (programa-form, programa-version-form, requisitos-form) NO se tocaron. Eliminados CSS muertos de upload en los 4 padres (`.drop-zone`, `.file-chip`, `.pending-upload-bar`, `.reemplazar-btn`, etc.). Verificado con `ng build --configuration development`; conteos con node (no grep, duplica en este entorno).
- **Página vs diálogo (2026-08-09)**: regla formalizada — forms simples → dialog desde la lista; wizards/pantallas especiales → página con ruta propia. Convertidos a dialog: `tipo-programa-form`, `programa-version-form`, `programa-form`, `modulo-form` (todos con shell `.dialog-header`/`.header-icon`, recarga de lista vía `dialogRef.close(true)`; se quitaron sus rutas `nuevo`/`editar`). `usuario-form` (wizard) pasó de dialog a página `/usuarios/nuevo` (ruta en `app.routes.ts`). `modulo-batch` (carga masiva) movido de ruta `nuevo` → `masiva` + botón propio "Carga masiva" en `modulo-list`. Home: acceso rápido "Programa" abre el dialog directo (`abrirNuevoPrograma`). Ojo: `docentes/nuevo` sigue vivo (docente-form no se tocó); `/ediciones/nueva` en home era un dead-link preexistente (no hay ruta top-level de ediciones). Verificado con `ng build --configuration development`.
- **Homogenización visual (2026-08-09)**: convergidos a la paleta de tokens `--fich-*` los hex sueltos de toda la app (script global ~1000 tokens: neutros slate, estados, clasificación, danger/success/warning/info, primary; quedaron sin tocar los feature-colors por carpeta y los multi-color intencionales de doc-matriz). Docente completo al canon: portal/detalle con `--fich-feature-docente` (teal) en avatar/bordes/iconos, badges de estado a `estado-pill` (nuevas variantes `.pausado`/`.cancelado` + alias guion en `estadoModuloClass`), `docente-list` a `estado-pill` + feature color, `docente-form` a `form-page` global, `docente-mis-modulos` a cards, `docente-calificar` a `.cal-pill` global. Token nuevo `--fich-feature-docente-lighter`. Nota de entorno: la sesión sufrió outputs de herramienta duplicados (git status, read, sed mostraban líneas 2×) — verificar archivos con node (conteos) antes de diagnosticar corrupción; los `edit()` pueden aplicarse duplicados (check con conteo tras editar).
- **Unificación catálogos CRUD (2026-08-09)**: listas de catálogo (programa, tipo-programa, modulo, tipo-descuento, requisitos, modalidad, roles, programa-version) alineadas al canon `page-container` + `header-section`/`header-left`/`header-right` + `.btn-nuevo` en header + `filters-bar`/`estado-pill`/`loading-state`/`empty-state` globales; eliminadas las duplicaciones locales (`.toolbar-actions`, `.estado-chip`, `.loading-container`, `.error-state`, `.form-container`/`.form-card`/`.actions`). Páginas-form (programa, tipo-programa, modulo, programa-version) pasan a `form-page` + `form-actions` globales. Nuevo modificador global `.empty-state.error`. El estado "error" usa `.empty-state.error`; los toggles de soft-delete siguen siendo `mat-slide-toggle` en tablas/rows. No se tocaron los tableros que usan `estado-chip` dinámico (notas-admin, inscripciones-landing, documentacion, pagos-admin). Verificado con `ng build --configuration development`.
- **Usuarios (2026-08-09)**: wizard "Registrar persona" 3 pasos (Tipo → Datos → Roles) + pantalla de credenciales con botones de copiar. Tipo = grid de 3 cards con color por tipo (alumno cian / docente teal / administrativo índigo). El Cargo NO se pide (se expresa con el rol; `UserAdminCreate.cargo` existe por compat). Password autogen = CI. `rolesSeleccionados` = `signal<number[]>` (bugfix signals). `usuarios-list` = grid de cards directorio (avatar iniciales por perfil, pills de rol sin prefijo `adm_`, footer "Alta dd/mm/aaaa", `.page-container` 1440px).
- **inscripcion-detail (2026-08-09)**: KPI strip (estado/promedio/docs/pagos) + 5 tabs (Recorrido/Notas/Pagos/Documentación/Solicitudes, Solicitudes oculto si no hay). Cards "Mis Notas"/"Mis Pagos" reusan `getTranscript` + `getTranscriptPagos` filtrando por DPA. Portal `alumno-portal` a 1560px.
- **Transcript (2026-08-08/09)**: "El recorrido del alumno" — hero con donut de promedio, ruta de hitos (aprobado/migrada/reprobado/en curso/saltado/pendiente) con "Estás acá", tiles Resumen, caption con chips de datos; tablero de módulos de la última inscripción; timeline de movimientos (retiro en historial, módulo de inicio por bloque, self-movements = bloque único); sección "Pagos del alumno" con boletas/desglose.
- **Pagos (2026-08-08/09)**: matriz por edición espejo de notas (cuotas por módulo, anillo %, `+` por fila, retirados colapsables); boletas/transacciones con anulación con motivo (permiso `pagos.anular` en seed); registro con comprobante base64 obligatorio y dialog de sobrante.
- **Docente-calificar (2026-08-07/08)**: tablero idéntico a la matriz admin (avatar, burbuja, leyenda, `table-layout: fixed`, columna alumno con `maxTextWidth`), sin columna CI (vive bajo el nombre), botón "Agregar nota" azul por fila + editar = lápiz. `POST/PATCH` de notas exige perfil docente + contratación + módulo `en_curso`.
- **Rutas planas / navbar dinámico (2026-08-07)**: eliminado shell admin; `NAV_ITEMS`/`buildNavRoutes`; `/estudiantes` vs `/alumnos`; `/docente` vs `/docentes`; navbar agrupa por `group`, scroll horizontal con flechas.
- **Reordenar módulos (2026-08-07)**: fechas por slot + clamp; validación por módulo movido; `HistorialModulo` "Reordenamiento — fechas intercambiadas"; preview de fechas heredadas en el dialog.
- **Migración con documentos (2026-08-07)**: card de migración pide motivo + docs (requisito 8 "Carta de Solicitud de Migración"); botón retirar oculto si la edición finalizó; seed de afinidad (Luke/Obi).
- **Notas-admin (2026-08-07)**: estilo cebra rechazado → tablero (anillos, burbujas, avatar, leyenda, prom-clasif bajo el anillo); cabecera 2 filas "Número de módulo"; columna Alumno adaptativa con buffer +12.
- **Docente login automático (2026-08-07)**: `POST /docentes/` auto-crea usuario (CI como pass); `must_change_password`; login step `cambio`; `crear_usuario` vincula docente por correo.
- **Aprobar incorporación (2026-08-07)**: selector de módulo de inicio con radios + casos A/B/C (progreso ≥50% → siguiente módulo, <50% → en curso, sin en_curso → próximo); solicitudes decididas = registro estático con `dpa_id_modulo_inicio`/`dpa_modulo_inicio`.
- **Registro público wizard (2026-08-07)**: `POST /auth/registro` crea alumno completo; 3 pasos; post-registro redirige a inscribir o portal; eliminado el sentinel nombre "Pendiente".
- **Requisitos-incorporación (2026-08-07)**: componente single-file con tabs dinámicos por tipo (badge de conteo), avatar por tipo (incorporación índigo/migración teal/reincorporación violeta).
- **2026-07-25/26**: eliminada `avance_modulo` y `nota.id_programa_version_edicion` (edición derivada del DPM); transcript merge de notas migradas por `historial_inscripcion` + match por nombre de módulo; `solicitud_requisito.tipo` → `id_tipo_solicitud` FK (migración 005).
- **2026-07-31**: inscripciones-edicion client-side (request 1×500, chips por estado, búsqueda, paginador custom); backend `per_page ≤ 500`.
- **2026-08-01**: inscripcion-detail hitos horizontales (5 hitos, "Observado"/"Retirado" como avisos aparte), danger-zone GitHub, migración/reincorporación contextual, reincorporación en apartado desplegable único.
- **2026-08-02**: `revisar-incorporacion` rediseñado (hero-card por tipo, motivo en cita, stats strip, timeline); bugfix import `ProgramaVersion`; entornos Supabase/local vía `DATABASE_URL`.
