# Kit Razor Pages — Andahuasi v1.0

Shell (sidebar, rail, drawer, flyouts, popovers, tema) + primera pantalla real (Configuración de ítems) listos para ASP.NET Core Razor Pages (.NET 8).
La maquetación y el comportamiento ya están hechos. Lo único pendiente es **conectar datos**: reemplazar los servicios de ejemplo por consultas reales a la base.

## 1. Copiar al proyecto

| Del kit | A tu proyecto |
|---|---|
| `GUIA-DISENO.md` | raíz del repositorio, **renombrado a `CLAUDE.md`** (reglas de diseño para programadores e IA) |
| `wwwroot/css/tokens.css`, `wwwroot/css/andahuasi.css` | `wwwroot/css/` |
| `wwwroot/js/shell.js` | `wwwroot/js/` |
| `wwwroot/img/logo-*.png` | `wwwroot/img/` |
| `Pages/Shared/_Layout.cshtml` | reemplaza el tuyo |
| `Pages/Shared/Components/Menu/Default.cshtml` | igual |
| `ViewComponents/MenuViewComponent.cs` | igual |
| `Models/*.cs`, `Services/*.cs` | igual |
| `Pages/Paltos/Fertilizacion/*` | igual |
| `docs/` (prototipo, capturas, especificación) | `docs/diseno/` (solo referencia) |
| `demo.html` | no se copia: abre en el navegador para ver el shell funcionando sin .NET |

> Si tu espacio de nombres raíz no es `Andahuasi`, reemplaza `Andahuasi.` en los archivos copiados.

## 2. Registrar servicios — `Program.cs`

```csharp
builder.Services.AddRazorPages();
builder.Services.AddScoped<IShellService, ShellServiceDemo>();                          // TODO: cambiar por ShellService real
builder.Services.AddScoped<IItemsFertilizacionService, ItemsFertilizacionServiceDemo>(); // TODO: cambiar por implementación real
```

## 3. `_ViewImports.cshtml`

```cshtml
@using Andahuasi
@using Andahuasi.Models
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
```

## 4. Quitar Bootstrap

La plantilla de Razor trae Bootstrap y jQuery. Elimina sus `<link>`/`<script>` del layout (el nuevo `_Layout.cshtml` ya no los carga) y no uses clases como `.btn`, `.form-control` o `.table` de Bootstrap: el sistema tiene las suyas con los mismos nombres cortos. Si usas validación del lado del cliente de jQuery, puedes mantener solo `jquery.validate` en las páginas que la necesiten.

## 5. Conectar datos (lo único que falta)

Busca `TODO` en el kit. Son estos puntos:

1. **Menú** — `ShellService.GetMenuAsync`: leer Módulos → Categorías → Accesos **permitidos para el rol del usuario**, con el icono `ri-*` de cada uno y la ruta. El badge (número) es opcional por acceso.
2. **Usuario** — `GetUsuarioAsync`: nombre y cargo del usuario autenticado; `FotoUrl` = null muestra la silueta.
3. **Notificaciones** — `GetNotificacionesAsync` + las páginas `/Notificaciones` y `/Notificaciones/MarcarLeidas`.
4. **Cerrar sesión** — el formulario apunta a `/Cuenta/Salir`; ajústalo a tu autenticación.
5. **Ítems de fertilización** — implementación real de `IItemsFertilizacionService` (buscar, resumen de tarjetas, guardar, subir el PDF).

## 6. Cómo se usa en páginas nuevas

- Cada página solo escribe su contenido; el shell lo pone `_Layout`.
- Empieza con `.page-head` (título + subtítulo + `.page-actions`).
- Elige plantilla: **A** `.tpl-list-panel` (lista + panel; en el kit `ViewData["FillHeight"] = true`, en el ERP `ViewData["shellFill"] = true`), **B** bandeja (stat-grid + toolbar + data-table a ancho completo), **C** formulario por secciones (`.card` con `.step-head` + panel de resumen).
- En A el scroll es solo de `.dt-body` y `.panel-body`. Título, métricas y filtros quedan fijos. No pongas `overflow: visible` en esos cuerpos.
- Componentes disponibles en `andahuasi.css`: `.btn` (`-primary`, `-outline`, `-ghost`, `-help`, `-danger`, `-sm`, `-lg`), `.icon-btn`, `.field`, `.input`, `.search` (+ `data-search-clear`), `.dropdown` (+ `data-dropdown-btn`, `data-value`, `data-submit`), `.segmented` (radios), `.stat-card`, `.pill-*`, `.badge`, `.data-table`, `.panel`, `.card`, `.step-num`, `.note`, `.empty`, `.modal` (`<dialog>` + `data-modal-open` / `data-modal-close`).
- `shell.js` activa todo por atributos `data-*`; no hay que inicializar nada.

## Comportamiento incluido
- Sidebar 300 px ≥1280, rail 55 px en 768–1279, drawer <768. La elección del usuario se guarda en cookie `sidebar`.
- Tema claro/oscuro desde el menú de cuenta; cookie `tema`, aplicado por el servidor (sin parpadeo).
- Árbol con búsqueda (sin tildes/mayúsculas), expandir/contraer todo; la rama del acceso actual se abre sola.
- En rail: clic en módulo → flyout con sus categorías; lupa → flyout con todo el árbol. Ambos con búsqueda y expandir/contraer.
- Popovers de cuenta y notificaciones: uno a la vez, se cierran con clic fuera o Esc.
