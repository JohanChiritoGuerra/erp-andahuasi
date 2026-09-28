# Guía de diseño — Andahuasi (para desarrolladores y agentes de IA)

Copia este archivo a la raíz del repositorio del frontend como `CLAUDE.md` (o `AGENTS.md`). Toda pantalla nueva debe cumplirlo. La referencia visual es `Sistema de Diseño Andahuasi.dc.html`; los valores exactos están en `tokens.css`.

## Principios
- Herramienta operativa de uso intensivo (6+ h/día). Prioriza densidad legible, estados claros y cero decoración.
- Grises fríos para la estructura y **un solo acento: azul #0067C0, fijo**. El usuario no puede cambiarlo; solo elige tema claro/oscuro.
- Nada de gradientes, sombras decorativas, emojis ni ilustraciones. Esquinas de 3–4 px.

## Reglas obligatorias
1. **Solo tokens.** Todo color, tamaño y sombra sale de `var(--*)` / clases del preset. Prohibido escribir hex en componentes.
2. **Acento con moderación.** Úsalo solo en: botón primario, elemento seleccionado/activo, foco, links de acción, badge del ítem activo y aviso nuevo. Un único botón primario por vista.
3. **Estados semánticos fijos.** Nunca uses el acento para comunicar un estado de negocio.
   | Variante | Tokens | Uso |
   |---|---|---|
   | success | `--success-bg/fg` | Configurado, completado, aprobado, cerrado OK |
   | warning | `--warning-bg/fg` | Pendiente, por revisar, en espera |
   | danger  | `--danger-bg/fg`  | Sin configurar, error, rechazado, vencido |
   | info    | `--info-bg/fg`    | Clasificación informativa (p. ej. Consumo común) |
   | neutral | `--chip/--chip-text` | No aplica, borrador, sin relevancia |
   Si aparece un estado nuevo, asígnalo a una de estas cinco variantes y regístralo aquí.
4. **Tipografía.** IBM Plex Sans. Base 14 px. Escala: 11 (etiqueta MAYÚS 600 +0.06em), 12 (secundario), 13 (interfaz), 14 (cuerpo/sección), 20 (título/métrica). Cifras y códigos con `tabular-nums`; IBM Plex Mono solo para códigos técnicos.
5. **Espaciado.** Grilla 8 px (medios pasos de 4). Controles: 28 / 32 / 36 px de alto. Padding de contenido: 20px 32px en desktop, 20px 16px en móvil. Contenedor máximo 1200 px.
6. **Iconos.** Remix Icon, siempre `ri-*-line`. 16 px en navegación y botones, 14 px en controles pequeños, 17 px en círculos de métricas. El icono de cada módulo/categoría viene de la base de datos (`ri-*`).
7. **Controles propios.** No uses `<select>` nativo ni barras de scroll visibles. Desplegables, popovers y modales son componentes propios con el estilo del sistema.
8. **Una superposición a la vez.** Popover, flyout, desplegable y modal se cierran con clic fuera y con Esc; abrir uno cierra los demás.
9. **Accesibilidad.** Texto ≥ 4.5:1 de contraste. *Excepción aprobada:* en tema oscuro `--accent-text` se mantiene en #0067C0 por decisión de marca (≈3:1); úsalo solo en textos ≥ 13 px peso 600 (ítem activo, opción seleccionada, links de acción), nunca en párrafos. Botones de solo icono con `aria-label`/`title`. Foco visible (borde de acento + halo `--accent-soft`). En móvil, objetivos táctiles ≥ 44 px.
10. **Tema oscuro gratis.** Si un componente usa solo tokens, funciona en oscuro sin cambios. Pruébalo siempre en ambos temas.

## Componentes (usa estos, no inventes variantes)
- **Botón**: primario (acento), secundario (borde), contorno (borde acento), fantasma, ayuda (borde punteado + `ri-question-line` en acento), destructivo (`--danger`), icono (30–32 px). Deshabilitado: fondo `--field`, texto `--hint`.
- **Campo**: etiqueta 12 px arriba, input 32 px, ayuda 11.5 px debajo; error con borde y texto `--danger-fg`.
- **Búsqueda**: lupa a la izquierda; aparece `ri-close-line` al escribir para limpiar.
- **Desplegable**: botón 32 px con chevron; menú con opción activa en `--accent-soft` + ✓.
- **Control segmentado**: 2–3 opciones excluyentes; la activa con `--accent-soft`, borde interno de acento y texto de acento.
- **Interruptor**: píldora de 36×20 con un círculo. Marcado = activo (pista de acento, círculo a la derecha); desmarcado = inactivo (pista `--chip`, círculo a la izquierda). El texto al lado dice Activos o Inactivos. No sustituye al control segmentado cuando hay más de dos opciones.
- **Tarjeta de métrica/filtro**: icono en círculo de 34 px (color de su estado), etiqueta 12 px, número 20 px; la seleccionada lleva borde de acento de 2 px. Máximo 4 por fila. En <768 px las 4 siguen en una sola fila, compactas (icono arriba, etiqueta y número abajo).
- **Pill de estado**: alto 20, radio 10, 11.5 px 600.
- **Badge numérico**: alto 18, min-width 20; inactivo `--chip`, sobre ítem activo `--accent`.
- **Tabla**: cabecera 34 px (`--field`, etiqueta MAYÚS), fila con código (12 px 600) + descripción (12.5 px), seleccionada con `--accent-soft` + `shadow-active-bar`; pie de 40 px con conteo y paginación. En < 768 px cada fila se apila como tarjeta.
- **Tarjeta de paso**: círculo numerado de 18 px en acento + título 13 px 600 + instrucción 12 px.
- **Nota informativa**: fondo `--accent-soft`, texto `--accent-text`. **Estado vacío**: borde punteado `--dash`, texto `--faint`, dice qué falta y cómo empezar.
- **Popover** (anclado a botón): radio 4, `shadow-popover`, ancho 224–320 px.
- **Modal**: cabecera 48 px con icono + título + cerrar; cuerpo 16 px; pie con acciones a la derecha. 460 px para ayuda y confirmaciones, 560 px para formularios cortos. Fondo `--scrim`. Las confirmaciones y la espera de un proceso usan este modal, no SweetAlert ni el `confirm` del navegador.

## Plantillas de pantalla
Toda pantalla empieza con: **título (20 px) + subtítulo** a la izquierda y **acciones** a la derecha (secundarias antes del primario).
- **A · Lista + panel de detalle** — catálogos y configuración. Lista a la izquierda (métricas → búsqueda + filtro → tabla), panel de 384 px a la derecha con acción final fija abajo. Ej.: Configuración de ítems. Clasificación de ítem: Pendiente (`pill-warning`), Nutriente (`pill-success`), Consumo común (`pill-info`). «Sin configurar» es `pill-danger` y no es una clasificación.
- **B · Bandeja de trabajo** — listas operativas. Métricas por estado → barra de búsqueda/filtros → tabla a ancho completo; el primario (Crear…) arriba a la derecha; el detalle abre en su propia ruta. Ej.: Ver OT asignadas, Solicitudes recibidas.
- **C · Formulario por secciones + resumen** — altas y documentos con cálculo. Tarjetas de paso numeradas a la izquierda; resumen fijo a la derecha con totales y la acción final. En móvil el resumen pasa al final. Ej.: Presupuesto de fertilización, Crear OT.

## Alto de la pantalla
En plantilla A y en la ruta de detalle, la página no hace scroll. Fijos: título, métricas, búsqueda, filtro, cabecera y pie de tabla o panel. El scroll vive solo en `.dt-body` y `.panel-body`.

- En el ERP: `ViewData["shellFill"] = true` (clase `shell-main--fill`). En el kit puro: `ViewData["FillHeight"] = true`.
- Cada ancestro de la lista, desde la columna principal hasta `.data-table`, lleva `min-height: 0` y `overflow: hidden`.
- En <1024 px el panel se oculta y el ítem abre su propia ruta, también fill: cabeza fija, cuerpo del formulario con scroll, pie fijo.
- Prohibido poner `overflow: visible` en `.dt-body` o `.panel-body` de una pantalla fill: el scroll vuelve a la página entera.

## Cómo queda una decisión en el sistema
Cuando una pantalla enseña un comportamiento que debe repetirse, se actualizan juntos:

1. `kit_razor_andahuasi/wwwroot/css/andahuasi.css` y, si cambia la estructura, el markup de referencia.
2. Este archivo y `kit_razor_andahuasi/GUIA-DISENO.md` (el mismo texto).
3. `.cursor/rules/diseno-andahuasi.mdc`, en una línea operativa.
4. En el ERP, la misma regla en `wwwroot/css/andahuasi-pages.css` con prefijo `.erp-ds`. No se deja una variante solo en la página.

## Shell
Sidebar 300 px (≥1280), rail 55 px (1024–1279), drawer 300 px (<768). Árbol Módulo → Categoría → Acceso filtrado por permisos del usuario. Ver `README.md` del paquete para el detalle completo.

## Antes de entregar una pantalla, verifica
- [ ] Solo tokens, ningún hex.
- [ ] Un solo primario; estados con su variante semántica.
- [ ] Funciona en claro, oscuro y móvil.
- [ ] Estados vacío, carga y error diseñados.
- [ ] Botones de icono con etiqueta accesible.
- [ ] En pantalla fill, al hacer scroll se mueven solo la lista o el cuerpo del panel; título, métricas y filtros siguen visibles.
