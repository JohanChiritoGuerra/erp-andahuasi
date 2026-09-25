# Andahuasi · Paquete completo v1.0 — LÉEME PRIMERO

Este paquete trae **todo** lo necesario para construir el frontend en ASP.NET Core Razor Pages con el diseño aprobado: shell, sistema de diseño, primera pantalla real y las reglas para que una IA (Claude Code u otra) siga el diseño sin desviarse.

## Dónde va cada cosa en tu proyecto

```
TuProyecto/                          ← raíz del repositorio
├─ CLAUDE.md                         ← GUIA-DISENO.md renombrado  (la IA lo lee sola)
├─ docs/diseno/                      ← carpeta docs/ completa del paquete (solo referencia)
│   ├─ prototipo/*.dc.html           ← abrir en el navegador para ver el diseño interactivo
│   ├─ screenshots/*.png             ← capturas de referencia
│   └─ README-diseno.md              ← especificación detallada del shell
├─ Program.cs                        ← registrar 2 servicios (ver README.md, paso 2)
├─ Models/                           ← Models/*.cs del paquete
├─ Services/                         ← Services/*.cs del paquete
├─ ViewComponents/                   ← ViewComponents/MenuViewComponent.cs
├─ Pages/
│   ├─ _ViewImports.cshtml           ← agregar los @using del README, paso 3
│   ├─ Shared/_Layout.cshtml         ← reemplaza el tuyo
│   ├─ Shared/Components/Menu/Default.cshtml
│   └─ Paltos/Fertilizacion/         ← ConfiguracionItems.cshtml(.cs) + _FilaNutriente.cshtml
└─ wwwroot/
    ├─ css/tokens.css                ← colores, tipografía, medidas (fuente de verdad)
    ├─ css/andahuasi.css             ← estilos de todos los componentes
    ├─ js/shell.js                   ← comportamiento (sidebar, flyouts, popovers, tema…)
    └─ img/logo-*.png
```

**No van al proyecto:** `demo.html` (vista previa sin .NET) y este archivo.

## Por qué así funciona con la IA

- **`CLAUDE.md` en la raíz** → Claude Code lo lee automáticamente en cada sesión. Para otras IA: Cursor → copia su contenido a `.cursor/rules/diseno.mdc`; GitHub Copilot → `.github/copilot-instructions.md`; Codex/otros → `AGENTS.md`. Mismo texto, distinto nombre.
- **`tokens.css` + `andahuasi.css`** son el sistema de diseño en código: la IA solo tiene que usar sus clases.
- **`docs/diseno/`** le da el contexto visual (capturas y prototipos) cuando necesita comparar.
- **`ConfiguracionItems.cshtml`** es el ejemplo de referencia: cualquier pantalla nueva se construye imitándolo.

## Primer mensaje sugerido para Claude Code

> Lee CLAUDE.md y docs/diseno/README-diseno.md. Instala el kit siguiendo README.md (pasos 1 a 4) y confirma que la app levanta con los datos de ejemplo. Después, implementa `ShellService` real leyendo Módulos → Categorías → Accesos de nuestra base de datos, filtrados por el rol del usuario.

## Para cada pantalla nueva

> Crea la página [nombre del acceso] del módulo [módulo] usando la plantilla [A/B/C] de CLAUDE.md. Toma como referencia Pages/Paltos/Fertilizacion/ConfiguracionItems.cshtml. Usa solo clases de andahuasi.css y tokens; nada de Bootstrap ni colores directos.

## Orden recomendado

1. Abrir `demo.html` y `docs/prototipo/Sistema de Diseño Andahuasi.dc.html` para ver el resultado esperado.
2. Seguir `README.md` (instalación en 6 pasos).
3. Conectar datos: buscar `TODO` en el código (5 puntos).
4. Construir las siguientes pantallas con las plantillas.

## Decisiones fijas del diseño
- Acento **azul #0067C0**, no configurable por el usuario; tema claro/oscuro sí.
- Tipografía **IBM Plex Sans**, base 14 px. Iconos **Remix Icon** `ri-*-line`.
- Sidebar 300 px · rail 55 px · drawer 300 px. Cortes: ≥1280 expandido, 768–1279 rail, <768 drawer.
