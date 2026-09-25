using Andahuasi.Models;
using Andahuasi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Andahuasi.Pages.Paltos.Fertilizacion;

public class ConfiguracionItemsModel : PageModel
{
    private readonly IItemsFertilizacionService _svc;
    public ConfiguracionItemsModel(IItemsFertilizacionService svc) => _svc = svc;

    // Filtros por URL (?tab=&estado=&q=&sel=) para que se puedan compartir y recargar
    [BindProperty(SupportsGet = true)] public string Tab { get; set; } = "todos";
    [BindProperty(SupportsGet = true)] public string Estado { get; set; } = "todos";
    [BindProperty(SupportsGet = true)] public string? Q { get; set; }
    [BindProperty(SupportsGet = true)] public string? Sel { get; set; }

    [BindProperty] public ConfigItemInput Input { get; set; } = new();

    public ResumenItems Resumen { get; private set; } = new(0, 0, 0, 0);
    public List<ItemAlmacen> Items { get; private set; } = new();
    public ItemAlmacen? Seleccionado { get; private set; }

    public async Task OnGetAsync() => await CargarAsync(true);

    public async Task<IActionResult> OnPostGuardarAsync()
    {
        if (!ModelState.IsValid) { await CargarAsync(false); return Page(); }
        await _svc.GuardarAsync(Input);
        TempData["Guardado"] = true;
        return RedirectToPage(new { Tab, Estado, Q, Sel = Input.Codigo });
    }

    private async Task CargarAsync(bool llenarFormulario)
    {
        Resumen = await _svc.GetResumenAsync();
        Items = await _svc.BuscarAsync(Tab, Estado, Q);
        Seleccionado = Sel != null ? await _svc.GetAsync(Sel) : Items.FirstOrDefault();
        if (Seleccionado != null && llenarFormulario) Input = ConfigItemInput.Desde(Seleccionado);
    }

    public string Link(string? tab = null, string? estado = null, string? sel = null) =>
        Url.Page(null, new { tab = tab ?? Tab, estado = estado ?? Estado, q = Q, sel = sel ?? Sel })!;

    public static readonly (string Key, string Texto)[] Estados =
        { ("todos", "Todos los estados"), ("configurado", "Configurados"), ("sin", "Sin configurar"), ("na", "No aplica") };
}
