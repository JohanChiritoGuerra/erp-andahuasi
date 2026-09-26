# Handoff: App Shell + Sistema de diseño — Andahuasi (v1.0)

> **Empieza por `design-system/CLAUDE.md`** (reglas) y `design-system/tokens.css` (valores). Este README detalla el shell; `ConfigItemsScreen.dc.html` es la primera pantalla real (plantilla A).

## Overview
Layout base (app shell) de la aplicación web B2B de gestión interna de Andahuasi (agroindustria azucarera). Incluye: sidebar con árbol de navegación de 3 niveles (Módulo → Categoría → Acceso), modo rail colapsado con flyouts, drawer móvil, popovers de cuenta y notificaciones, tema claro/oscuro y una pantalla de contenido vacía de ejemplo. No incluye funcionalidad de negocio.

Usuarios: operativos, 6+ h/día, pantallas grandes; uso ocasional en móvil.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML**: prototipos que muestran el aspecto y el comportamiento esperados, **no código de producción para copiar**. La tarea es **recrear este diseño en el entorno del proyecto destino** (React, Angular, Vue, Blazor, Razor, etc.) usando sus patrones y librerías. Si no existe entorno aún, elegir el framework más apropiado.

Para ver el prototipo: abrir `App Shell Andahuasi.dc.html` en un navegador (requiere `support.js` y los PNG en la misma carpeta). Muestra 6 frames: claro/oscuro × expandido/rail/móvil. Todo es interactivo.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado, medidas e interacciones son finales. Recrear pixel-perfect.

---

## Design Tokens

### Tipografía
- Familia: **IBM Plex Sans** (400, 500, 600, 700). Mono auxiliar: IBM Plex Mono (solo etiquetas técnicas).
- Base: 14px. `-webkit-font-smoothing: antialiased`.

| Uso | Tamaño | Peso | Line-height | Extra |
|---|---|---|---|---|
| Título de pantalla (h1) | 20px | 600 | 26px | letter-spacing −0.01em |
| Subtítulo pantalla | 13px | 400 | — | color `--muted` |
| Ítem módulo (nivel 1) | 13px | 600 | — | letter-spacing 0.01em |
| Ítem categoría (nivel 2) | 13px | 500 | — | — |
| Ítem acceso (nivel 3) | 13px | 500 (600 activo) | — | — |
| Encabezado flyout / popover | 10–12px | 600 | — | MAYÚSCULAS, letter-spacing 0.06–0.1em, color `--faint` |
| Nombre usuario | 12px | 600 | 15px | — |
| Cargo usuario | 11px | 400 | 14px | color `--muted` |
| Badge numérico | 11px | 600 | — | tabular-nums |
| Botones | 13px | 500 (secundario) / 600 (primario) | — | — |
| Inputs de búsqueda | 13px (sidebar) / 12.5px (flyout) | 400 | — | — |

### Espaciado
Grilla de 8px. Valores usados: 2, 4, 6, 8, 10, 12, 16, 20, 24, 32.

### Radios
- 3px: botones, inputs, ítems, avatar, recuadros de iconos.
- 4px: flyouts, popovers, tarjetas.
- 9px: badges (pill). 50%: puntos de estado.

### Sombras
- Flyouts / popovers: `0 12px 32px rgba(6,10,11,.22)` a `0 14px 36px rgba(6,10,11,.26)`.
- Drawer móvil abierto: `10px 0 30px rgba(15,23,26,.16)`.
- Sin gradientes ni sombras decorativas en el resto.

### Colores — Tema claro
| Token | Valor | Uso |
|---|---|---|
| `--bg` | #f3f5f6 | Fondo del área de contenido |
| `--panel` | #ffffff | Sidebar, header móvil, popovers |
| `--border` | #e4e8ea | Bordes y divisores |
| `--field` | #f7f9fa | Fondo de inputs y botones de icono |
| `--text` | #141b20 | Texto principal |
| `--item` | #3c464c | Texto ítems de navegación |
| `--muted` | #6d787f | Texto secundario |
| `--faint` | #67727a | Encabezados, placeholders |
| `--hint` | #a5aeb3 | Chevrons, puntos inactivos |
| `--icon` | #7d878d | Iconos de navegación |
| `--hover` | #f1f4f5 | Hover de ítems/botones |
| `--chip` | #e7ecee | Fondo badge inactivo, avatar |
| `--chip-text` | #5c676d | Texto badge inactivo |
| `--dash` | #d3dade | Borde punteado placeholder contenido |
| `--scrim` | rgba(15,23,26,0.45) | Overlay del drawer |

### Colores — Tema oscuro
| Token | Valor |
|---|---|
| `--bg` | #101517 |
| `--panel` | #171d20 |
| `--border` | #262e32 |
| `--field` | #1b2225 |
| `--text` | #e7ecee |
| `--item` | #c3ccd0 |
| `--muted` | #96a1a7 |
| `--faint` | #9aa4a9 |
| `--hint` | #6c767b |
| `--icon` | #8b959a |
| `--hover` | #1f272a |
| `--chip` | #242c30 |
| `--chip-text` | #a3adb2 |
| `--dash` | #2c3538 |
| `--scrim` | rgba(6,10,11,0.6) |

### Color de acento (único, usar con moderación)
Acento oficial de producción: **Azul #0067C0, fijo** (el usuario no lo cambia; solo elige tema claro/oscuro). Las columnas verdes quedan solo como registro histórico. Los estados de negocio usan colores semánticos propios (success/warning/danger/info/neutral); ver `design-system/tokens.css`.

| Token | Azul · claro | Azul · oscuro | Verde · claro | Verde · oscuro |
|---|---|---|---|---|
| `--accent` | #0067c0 | #0067c0 | #0a7a3c | #2f9e5d |
| `--accent-hover` | #0056a1 | #0056a1 | #086831 | #278a50 |
| `--accent-fg` | #ffffff | #ffffff | #ffffff | #0c1310 |
| `--accent-soft` | #e7f0f9 | rgba(0,103,192,0.20) | #e9f4ed | rgba(47,158,93,0.14) |
| `--accent-text` | #0067c0 | #0067c0 | #0a6a34 | #66c68c |

Uso del acento: botón primario, ítem activo (fondo `--accent-soft` + barra interna 2px `inset 2px 0 0 var(--accent)` + texto `--accent-text`), badge del ítem activo, punto de notificación, notificación no leída, opción de tema activa, links de acción ("Marcar leídas", "Ver todas"), borde focus de inputs.

Otros colores fijos:
- Cerrar sesión: fondo #d9382f, hover #bf2f27, texto #fff.
- Punto de estado online en avatar: #3fa94b, 8px, con anillo 2px del color `--panel`.

---

## Layout y responsive

| Ancho viewport | Sidebar |
|---|---|
| ≥ 1280px | Expandido, **300px** |
| 1024–1279px | Rail colapsado por defecto, **55px** |
| < 768px | Oculto; drawer off-canvas **300px** con overlay |

(768–1023px: usar rail.) El usuario puede alternar expandido/rail manualmente en desktop; transición `width .18s ease`.

Estructura: `[sidebar] [columna contenido]` en flex horizontal, alto 100% del viewport. El sidebar es una columna flex: cabecera de marca (56px) → búsqueda → nav (flex:1, scroll) → footer de usuario (fijo abajo).

**Scroll:** ningún contenedor muestra barra de scroll (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`); se desplaza con rueda o gesto táctil. `overscroll-behavior: contain`.

---

## Componentes

### 1. Cabecera de marca (sidebar, desktop)
- Alto 56px, padding 0 10px, borde inferior `--border`, gap 8px.
- **Expandido:** logo Andahuasi a la izquierda (claro: `logo-claro.png` teñido con el acento; oscuro: `logo-oscuro-blanco.png`) + botón contraer a la derecha.
- **Rail:** solo el botón contraer/expandir, centrado.
- Botón contraer: 30×30, radio 3, fondo transparente, icono "panel lateral" 16px color `--muted`; hover fondo `--hover`, color `--text`.

### 2. Búsqueda global (sidebar)
- Contenedor: padding 12px 10px, borde inferior, flex con gap 6px.
- Input: alto 32px, borde 1px `--border`, radio 3, fondo `--field`, icono lupa 16px + placeholder "Buscar accesos..."; focus: borde `--accent`.
- Cuando hay texto aparece una **X** (botón 22×22, icono 16px trazo 2.1, color `--text`, hover color `--accent`) que limpia la búsqueda.
- A la derecha: botón **Expandir/contraer todo** 32×32 (mismo estilo de campo). Icono de chevrons dobles que cambia según estado (todos abiertos ↔ no).
- **Rail:** solo un botón lupa 44×32 centrado que abre el *flyout global* (ver 6).
- Comportamiento de búsqueda: filtra por nombre de acceso (sin distinguir tildes ni mayúsculas); las ramas con coincidencias se auto-expanden; si no hay resultados: "Sin accesos que coincidan." (12px, `--faint`).

### 3. Árbol de navegación (3 niveles)
Padding del nav: 8px 10px 16px. Filas con gap 1–2px.

| Nivel | Contenido | Alto mín. | Padding izq. | Icono |
|---|---|---|---|---|
| 1 Módulo | icono + label + chevron | 32px | 8px | 16px, `--icon` |
| 2 Categoría | icono + label + chevron | 32px | 22px | 16px, `--icon` |
| 3 Acceso | punto + label + badge opcional | 32px | 36px | punto 5px `--hint` (activo: `--accent`) |

- Chevron 13px, color `--hint`, rota 90° al abrir (`transform .15s ease`).
- Hover de fila: fondo `--hover`. Radio 3px. Texto con ellipsis.
- Acceso activo: fondo `--accent-soft`, barra interna 2px acento, texto `--accent-text` peso 600.
- Badge: min-width 20, alto 18, padding 0 6, radio 9; inactivo `--chip`/`--chip-text`, activo `--accent`/`--accent-fg`.
- Módulos sin categorías no muestran chevron.
- **Rail:** solo iconos de módulo centrados (sin labels ni hijos); clic abre el flyout del módulo.

### 4. Footer de usuario (sidebar)
- Borde superior, padding 10px 12px, flex gap 8px.
- **Expandido:** [avatar 30×30] [nombre + cargo] [campana 28×28].
  - Avatar: botón, radio 3, borde `--border`, fondo `--chip`, silueta de persona 17px (placeholder de foto) + punto online.
  - Nombre ejemplo: "Chirito Guerra, Johan"; cargo: "Jefe Dpto. de Sistemas".
  - Campana: icono 16px `--muted`, punto de 6px acento arriba a la derecha.
- **Rail:** apilado vertical centrado: campana arriba, avatar abajo.
- **Drawer móvil:** solo nombre y cargo (sin avatar ni campana; están en el header móvil).

### 5. Popover de cuenta (clic en avatar)
- Ancho 224px (en expandido ocupa el ancho del sidebar menos 10px por lado), padding 6, radio 4, borde, fondo `--panel`, sombra.
- Posición: **expandido** sobre el footer; **rail** a la derecha del sidebar (`left: calc(100% - 4px)`, anclado abajo); **móvil** bajo el botón del header, alineado a la derecha.
- Ítems (alto 34, padding 0 8, gap 10, 13px): "Ver mi perfil", "Modo claro", "Modo oscuro" (el tema activo se marca con `--accent-soft` + `--accent-text`), divisor 1px, botón rojo "Cerrar sesión" con icono de salida.

### 6. Flyouts de navegación (solo rail)
- Ancho **322px**, se abre a la derecha del rail (`left: calc(100% - 4px)`), alineado verticalmente con el botón que lo abrió, limitado para no salir del viewport (top mín. 8px).
- Estructura: título en mayúsculas → fila fija de búsqueda + botón expandir/contraer todo → cuerpo con scroll (solo el cuerpo hace scroll).
- **Flyout de módulo** (clic en icono de módulo): categorías y accesos de ese módulo; placeholder "Buscar en el módulo..."; categorías abiertas por defecto.
- **Flyout global** (clic en lupa): árbol completo Módulo → Categoría → Acceso, igual que el sidebar; placeholder "Buscar accesos..."; todo contraído por defecto.
- Cierra al: volver a pulsar el mismo botón, elegir un acceso, clic fuera, o abrir un popover.

### 7. Popover de notificaciones (clic en campana)
- Ancho 320px (292px en móvil), radio 4, borde, sombra, overflow hidden.
- Posición: desktop (expandido y rail) a la **derecha del sidebar**, anclado abajo; móvil bajo la campana del header.
- Cabecera: "NOTIFICACIONES" (12px, 600, mayúsculas) + link "Marcar leídas" (acento).
- Lista (máx. 280px de alto, scroll sin barra): cada ítem padding 10px 12px, divisor inferior; punto 7px (no leída: acento sólido; leída: aro 1px `--hint`), título 13px (600 no leída / 500 leída), meta 11.5px `--muted` ("Módulo · hace X").
- Pie: "Ver todas" centrado, acento, 12.5px 600.

### 8. Header móvil (< 768px)
- Alto 56px, padding 0 12px, fondo `--panel`, borde inferior, gap 12px.
- [botón menú 32×32 con borde] [logo, flex] [campana 32×32] [avatar 32×32].
- En desktop **no hay header superior**.

### 9. Drawer móvil
- 300px, `position:absolute`, entra con `transform: translateX(-100% → 0)` `.22s cubic-bezier(.2,.7,.3,1)`.
- Overlay `--scrim` detrás; clic en overlay cierra.
- Contenido: búsqueda (sin cabecera de logo) → árbol → footer solo nombre/cargo.
- Elegir un acceso cierra el drawer.

### 10. Área de contenido
- Padding: desktop 20px 32px, móvil 20px 16px. Contenedor centrado `max-width: 1200px`.
- Cabecera de pantalla: h1 (nombre del acceso activo) + subtítulo a la izquierda; acciones a la derecha, flex-wrap: "Exportar" (secundario) y "+ Nueva orden" (primario).
- Botón secundario: alto 32, padding 0 12, borde `--border`, fondo `--panel`, 13px 500. Hover `--hover`.
- Botón primario: alto 32, padding 0 12, fondo/borde `--accent`, texto `--accent-fg` 13px 600, icono + 14px. Hover `--accent-hover`.
- Placeholder de contenido: borde 1px punteado `--dash`, radio 4, alto mín. 320px.

---

## Interactions & Behavior
- **Un solo popover/flyout abierto a la vez.** Abrir uno cierra los otros. Abrir el drawer cierra popovers.
- **Clic fuera** (mousedown/touchstart en fase de captura) cierra cualquier popover o flyout. Solo cuentan como "dentro" el propio panel y su botón disparador.
- Toggle expandido/rail: persiste la preferencia del usuario (recomendado: localStorage o perfil de usuario).
- Tema claro/oscuro: seleccionable desde el popover de cuenta; aplica a toda la app vía tokens CSS. Recomendado persistirlo por usuario y respetar `prefers-color-scheme` como valor inicial.
- Seleccionar acceso: marca activo, actualiza el título y la ruta de la pantalla, y cierra drawer/flyout.
- Todos los botones de solo icono llevan `title`/`aria-label` (p. ej. "Notificaciones", "Cuenta", "Expandir o contraer todo", "Borrar búsqueda").

## State Management
| Estado | Tipo | Notas |
|---|---|---|
| `collapsed` | bool | expandido/rail; valor inicial según breakpoint |
| `drawerOpen` | bool | solo móvil |
| `activeAccessKey` | string | derivar de la ruta actual |
| `expanded` | Record<key, bool> | nodos abiertos del árbol (módulos y categorías) |
| `query` | string | búsqueda del sidebar |
| `flyout` | `{ key: moduleKey \| '__all', top }` \| null | flyout abierto en rail |
| `flyQuery`, `flyClosed` | string, Record | búsqueda y categorías cerradas del flyout; se reinician al abrir otro |
| `accountMenuOpen`, `notificationsOpen` | bool | mutuamente excluyentes |
| `theme` | 'light' \| 'dark' | |

### Datos
El árbol debe venir del backend **filtrado por permisos del usuario**:
```ts
type Access   = { key: string; label: string; route: string; badge?: number };
type Category = { key: string; label: string; icon: string; items: Access[] };
type Module   = { key: string; label: string; icon: string; cats: Category[] };
```
Notificaciones: `{ id, title, module, createdAt, read }` + contador de no leídas para el punto de la campana. Usuario: `{ name, role, photoUrl? }` (sin foto → silueta).

Datos de ejemplo usados (módulos): Administración, Comercialización, Finanzas, Gestión estratégica, Logística, Producción, Recursos humanos, Paltos, Mantenimiento. Ver `DATA` en `AppShellFrame.dc.html`.

## Assets
- `logo-claro.png`, `logo-mask.png`: logotipo para tema claro (la máscara permite teñirlo con el acento).
- `logo-oscuro-blanco.png`: logotipo para tema oscuro.
- `logo-claro-mark.png`, `logo-oscuro.png`: variantes auxiliares.
- **Recomendado:** reemplazar por el SVG oficial de Relaciones Públicas.
- Iconos: **Remix Icon, variante `ri-*-line`** (decisión oficial; la base ya guarda códigos `ri-*` por módulo/categoría). El prototipo usa un set de trazo propio equivalente solo como ilustración; en producción usar Remix a 16 px.
- Fuente: IBM Plex Sans / Mono (Google Fonts, licencia OFL).

## Files
- `App Shell Andahuasi.dc.html`: lienzo de referencia con los 6 estados.
- `AppShellFrame.dc.html`: el shell completo. En su bloque de script: tokens (`THEMES`, `ACCENTS`), datos de ejemplo (`DATA`, `ICONS`) y toda la lógica de estado. La plantilla contiene la estructura y los estilos exactos.
- `support.js`: runtime necesario solo para abrir el prototipo en el navegador (no forma parte de la implementación).
- `*.png`: logos.
- `ConfigItemsScreen.dc.html`: pantalla Paltos · Fertilización · Configuración de ítems (plantilla A: lista + panel).
- `design-system/Sistema de Diseño Andahuasi.dc.html`: catálogo visual de fundamentos, componentes, plantillas y modo oscuro.
- `design-system/tokens.css`: variables CSS claro/oscuro (fuente de verdad).
- `design-system/tailwind.preset.js`: preset opcional si el proyecto usa Tailwind.
- `design-system/CLAUDE.md`: reglas de uso para programadores y agentes de IA; copiar a la raíz del repo.
- `screenshots/`: 01–06 shell (claro/oscuro × expandido/rail/móvil), 07–09 Configuración de ítems. Referencias: capturas de referencia de los 6 estados (01–03 claro, 04–06 oscuro: expandido, rail, móvil). Ante cualquier duda, manda el prototipo interactivo.
