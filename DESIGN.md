---
name: "Unidad de Postgrado — FICH / UPC"
description: "Sistema de Control de Posgrado — gestión académica con identidad institucional moderna"
colors:
  azul-fich: "#1e3a8a"
  azul-fich-hover: "#1e40af"
  azul-fich-claro: "#eef2ff"
  azul-profundo: "#1a3a6c"
  rojo-alerta: "#d32f2f"
  rojo-alerta-claro: "#fee2e2"
  verde-aprobado: "#16a34a"
  verde-aprobado-claro: "#dcfce7"
  ambar: "#ca8a04"
  ambar-claro: "#fef9c3"
  peligro: "#dc2626"
  pizarra: "#1e293b"
  pizarra-suave: "#475569"
  gris-medio: "#64748b"
  gris-suave: "#94a3b8"
  limite: "#e2e8f0"
  limite-claro: "#f1f5f9"
  fondo: "#f1f5f9"
  superficie: "#ffffff"
  fondo-sutil: "#f8fafc"
  fondo-hover: "#f1f5f9"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(1.8rem, 3.5vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(1.3rem, 2.5vw, 1.6rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.azul-fich}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.azul-fich-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  button-stroked:
    backgroundColor: "transparent"
    textColor: "{colors.pizarra-suave}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "44px"
  button-stroked-hover:
    backgroundColor: "{colors.fondo-hover}"
    textColor: "{colors.pizarra}"
  chip-programado:
    backgroundColor: "{colors.azul-fich-claro}"
    textColor: "{colors.azul-profundo}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  chip-en-curso:
    backgroundColor: "{colors.verde-aprobado-claro}"
    textColor: "{colors.verde-aprobado}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  chip-pausado:
    backgroundColor: "{colors.ambar-claro}"
    textColor: "{colors.ambar}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  chip-cancelado:
    backgroundColor: "{colors.rojo-alerta-claro}"
    textColor: "{colors.peligro}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  card-surface:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  input-outlined:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.pizarra}"
    rounded: "{rounded.md}"
    height: "48px"
---

# Design System: Unidad de Postgrado — FICH / UPC

## 1. Overview

**Creative North Star: "El Taller del Postgrado"**

Un taller donde cada herramienta tiene su lugar. El diseño no compite con el contenido — lo organiza con la precisión de un artesano. Cada elemento existe porque resuelve una tarea real: crear una edición, asignar un módulo, consultar un historial. No hay decoración gratuita.

La paleta nace del Azul FICH, tratado con respeto institucional pero aplicado con la disciplina de una herramienta SaaS moderna. Las superficies blancas y los grises cálidos (tentados hacia el azul con croma mínimo) dan una base limpia y serena. El color aparece con intención: estados en chips, acentos en hover, iconos en navegación. Nada es al azar.

**Key Characteristics:**
- Limpieza quirúrgica — aire para respirar,间距 generoso, sin ruido visual
- Azul como firma, no como fondo — el color institucional aparece en puntos específicos, no empapa la interfaz
- Micro-interacciones rápidas (<250ms) — fade, slide, hover; el sistema responde, no entretiene
- Consistencia de taller — cada tabla, formulario y card sigue el mismo patrón estructural, con variación deliberada en acento y ritmo
- Rechaza explícitamente: templates de admin genéricos, sombras excesivas, bordes laterales de acento, texto gradiente

## 2. Colors

Una paleta institucional moderna. El Azul FICH es el ancla visual; los neutros están tentados hacia el azul (croma ~0.008) para cohesionar sin teñir.

### Primary

- **Azul FICH** (#1e3a8a / oklch(35% 0.08 270)): Color insignia. Se usa en botones primarios, links activos, badges de estado, headers de sección. Concentrado, no derramado.
- **Azul FICH Claro** (#eef2ff / oklch(95% 0.015 270)): Fondos de estado activo, hover de navegación, resaltado de fila activa en tablas.
- **Azul Profundo** (#1a3a6c / oklch(30% 0.06 270)): Títulos de página, variante hover de botones primarios.

### Accent

- **Rojo Alerta** (#d32f2f / oklch(50% 0.18 30)): Exclusivo para acciones destructivas, errores, estado cancelado. Un solo propósito.
- **Verde Aprobado** (#16a34a / oklch(55% 0.14 150)): Estado "en curso", confirmaciones, success chips.
- **Ámbar** (#ca8a04 / oklch(65% 0.12 85)): Estado "pausado", advertencias.

### Neutral

- **Pizarra** (#1e293b / oklch(25% 0.01 270)): Texto principal. Contraste alto sin llegar a negro puro.
- **Pizarra Suave** (#475569 / oklch(40% 0.01 270)): Texto secundario, metadata.
- **Gris Medio** (#64748b / oklch(50% 0.008 270)): Texto mutado, placeholders, subtítulos.
- **Gris Suave** (#94a3b8 / oklch(65% 0.008 270)): Iconos de fondo, hints visuales.
- **Límite** (#e2e8f0 / oklch(88% 0.005 270)): Bordes de componentes.
- **Límite Claro** (#f1f5f9 / oklch(93% 0.003 270)): Bordes de tabla, divisores suaves.
- **Fondo** (#f1f5f9 / oklch(93% 0.003 270)): Fondo de página.
- **Superficie** (#ffffff): Cards, tablas, contenedores de formulario.
- **Fondo Sutil** (#f8fafc / oklch(97% 0.002 270)): Encabezados de tabla, variante hover sutil.
- **Fondo Hover** (#f1f5f9): Hover de filas en tabla, hover de nav links.

### Named Rules

**La Regla del Azul Concentrado.** El Azul FICH aparece en ≤15% de cualquier pantalla. Su rareza es su potencia. Un botón primario, un badge, un link activo — nunca un fondo de página o una card completa.

**La Regla del Chroma Mínimo.** Todos los neutros llevan un tinte azul de croma ≤0.01. No son grises muertos; respiran el color institucional sin decirlo explícitamente.

## 3. Typography

**Display Font:** Inter (sans-serif)
**Body Font:** Inter (sans-serif)
**Label Font:** Inter (sans-serif) — weights 300-900 cargados desde Google Fonts

Inter ofrece precisión suiza con calidez humanista. Funciona igual en títulos grandes que en labels pequeños de tabla — versatilidad que evita tener que cambiar de fuente entre contextos.

### Hierarchy

- **Display** (800, clamp(1.8rem, 3.5vw, 2.2rem), 1.15): Hero de página, títulos de sección principales. Letter-spacing -0.02em.
- **Headline** (700, clamp(1.3rem, 2.5vw, 1.6rem), 1.2): Títulos de formulario, encabezados de sección interna. Letter-spacing -0.02em.
- **Title** (600, 1rem, 1.3): Títulos de card, nombres de módulo, filas destacadas. Letter-spacing -0.01em.
- **Body** (400, 0.875rem, 1.6): Texto corriente, descripciones, párrafos. Cap line length a 65-75ch.
- **Label** (500, 0.78rem, 1.2): Labels de formulario, texto de tabla, badges, chips. Letter-spacing 0.01em.
- **Mono** (500, 0.82rem, 1.2): Siglas de módulo, números de edición, versiones. Monospace via `font-family: monospace` para alineación vertical en listas.

### Named Rules

**La Regla del Peso Justo.** Nunca se usa weight 300 en interfaces funcionales. El minimum es 400 para body, 500 para labels, 600+ para títulos. La legibilidad no se negocia.

## 4. Elevation

Sistema de capas suaves. La profundidad se comunica con sombras sutiles, no con superposición tonal. Las superficies descansan sobre el fondo con una sombra mínima que las separa sin flotar.

### Shadow Vocabulary

- **Sombra Leve** (`box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04)`): Cards en reposo, contenedores de formulario.
- **Sombra Media** (`box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06)`): Cards en hover, tablas, dropdowns.
- **Sombra Profunda** (`box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04)`): Modales, diálogos, contenedores elevados.
- **Sombra Máxima** (`box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05)`): Notificaciones, tooltips.

### Named Rules

**La Regla de la Sombra Parca.** Una sombra más grande nunca es "más dramática"; es contextual. La sombra máxima solo para elementos que necesitan estar por encima de todo lo demás (modales, snackbars). No hay sombras decorativas.

## 5. Components

### Buttons
- **Shape:** Esquinas suaves (border-radius: 12px). Altura estándar de 44px.
- **Primary:** Fondo Azul FICH (#1e3a8a), texto blanco, padding horizontal 24px, weight 600. Sombra hover: 0 4px 12px rgba(26, 58, 108, 0.2).
- **Hover:** Azul FICH Hover (#1e40af), translateY(-1px), sombra incrementada.
- **Active:** Sin translateY, sombra reducida. Feedback táctil.
- **Stroked:** Borde Límite (#e2e8f0), texto Pizarra Suave. Hover: borde y texto oscurecen.
- **Icon Button:** 40x40px, color Gris Medio. Hover: Fondo Hover, color Pizarra.

### Chips (Badges de estado)
- **Shape:** Pill (border-radius: 9999px). Padding vertical 2px, horizontal 10px. Weight 600, font-size 0.75rem.
- **Programado / Activo:** Fondo Azul FICH Claro, texto Azul Profundo.
- **En Curso:** Fondo Verde Aprobado Claro, texto Verde Aprobado.
- **Pausado / Reprogramado:** Fondo Ámbar Claro, texto Ámbar.
- **Finalizado / Inactivo:** Fondo Hover, texto Gris Medio.
- **Cancelado:** Fondo Rojo Alerta Claro, texto Peligro.

### Cards / Containers
- **Corner Style:** Esquinas redondeadas (border-radius: 16px).
- **Background:** Superficie (#ffffff).
- **Shadow Strategy:** Sombra Leve en reposo, Sombra Media en hover (para cards clickeables).
- **Border:** 1px sólido Límite Claro (cards de navegación) o Límite (cards de formulario).
- **Internal Padding:** 16-24px, variable según contenido.

### Tables
- **Wrapper:** Superficie, border-radius 16px, borde 1px Límite Claro, sombra media.
- **Header row:** Fondo Sutil, texto Gris Medio, weight 700, tamaño 0.72rem, uppercase, letter-spacing 0.05em. Padding 14px 16px.
- **Data cells:** Pizarra (#1e293b), tamaño 0.92rem, padding 12px 16px, borde inferior Límite Claro.
- **Row hover:** Fondo Hover (no un azul arbitrario).
- **Actions column:** white-space: nowrap, icon buttons.
- **Empty state:** Icono grande (48px, opacidad 0.3) + texto Gris Medio + botón CTA opcional.

### Inputs / Fields
- **Style:** Outlined. Borde Límite, fondo Superficie, borde-radius 12px.
- **Focus:** Borde cambia a Azul FICH, label flota en Azul FICH.
- **Prefix icon:** Gris Medio en reposo, Azul FICH en foco.
- **Error:** Borde Rojo Alerta, texto de error en Rojo Alerta.
- **Disabled:** Fondo Fondo Sutil, texto Gris Suave.

### Navigation
- **Style:** Toolbar blanca, sticky top, borde inferior Límite, sombra leve.
- **Brand:** Emblema FICH/UPC con gradiente azul (linear-gradient 135deg #1e3a8a → #2563eb), texto al lado.
- **Nav links:** Padding 6px 14px, texto Pizarra Suave, weight 500, icon-outlined. Hover: Fondo Hover. Active: Fondo Azul FICH Claro, texto Azul FICH, weight 600, icon-filled.
- **Actions section:** Separador vertical, icon buttons para notificaciones y perfil.

## 6. Do's and Don'ts

### Do:
- **Do** usar Azul FICH concentrado: ≤15% de la pantalla, en puntos de interacción clave.
- **Do** mantener la jerarquía tipográfica: Display → Headline → Title → Body → Label. Sin saltos arbitrarios.
- **Do** usar las variables CSS (`--fich-primary`, `--fich-text`, etc.) en lugar de valores hardcodeados.
- **Do** respetar la Regla del Chroma Mínimo en todos los grises.
- **Do** animar con propósito: transiciones <250ms, ease-out quart/quint, fade + slide.
- **Do** usar las superficies blancas como contenedores principales; el fondo gris (#f1f5f9) es el canvas, no las cards.
- **Do** mantener consistencia estructural entre features: misma anatomía de listas, formularios, headers de página.

### Don't:
- **Don't** usar bordes laterales de colores (`border-left: 4px solid ...`) como acento decorativo en cards o listas.
- **Don't** usar texto con gradiente (`background-clip: text`). El énfasis se logra con peso y tamaño.
- **Don't** usar negro puro (#000) ni blanco puro (#fff) en ningún elemento. Los neutros siempre llevan tinte azul.
- **Don't** aplicar glassmorphism (fondos con blur y transparencia) como decoración.
- **Don't** repetir el mismo card idéntico en grilla — variar ritmo, acento o tamaño.
- **Don't** usar modales como primera opción — agotar alternativas inline y progresivas.
- **Don't** hardcodear colores fuera de las variables CSS. Cada valor hex debe estar definido en `:root`.
- **Don't** crear tablas sin estado vacío, de carga o de error — los tres son obligatorios.
- **Don't** superponer `::ng-deep` para estilos de formulario cuando se pueda lograr con variables CSS globales.
- **Don't** usar animaciones que excedan 300ms para transiciones funcionales. Las animaciones decorativas (stagger, entrada de página) no deben exceder 400ms.
