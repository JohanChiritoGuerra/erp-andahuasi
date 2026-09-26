using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Paltos.Fertilizacion.ConfiguracionItems;

[Acceso("/paltos/fertilizacion/configuracion-items")]
public class IndexModel : PageModel
{
    private readonly PaltosApi _paltos;

    public IndexModel(PaltosApi paltos) => _paltos = paltos;

    public async Task<IActionResult> OnGetListaAsync()
    {
        var response = await _paltos.GetItemsAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Items, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetDetalleAsync(string codigo)
    {
        var (grp, cls, ite) = Parse(codigo);
        try
        {
            var item = await _paltos.GetItemAsync(grp, cls, ite);
            var elementos = await _paltos.GetElementosAsync();
            return new JsonResult(new
            {
                success = item.BaseResponse.Success,
                data = item.Item,
                elementos = elementos.Elementos,
                message = item.BaseResponse.Message,
                key = $"{grp}-{cls}-{ite}",
                grp,
                cls,
                ite
            });
        }
        catch (Exception ex)
        {
            return new JsonResult(new { success = false, message = ex.Message });
        }
    }

    public async Task<IActionResult> OnPostGuardarAsync(string codigo, [FromBody] GuardarItemFertilizacionRequest request)
    {
        var (grp, cls, ite) = Parse(codigo);
        request.GrpAlmId = grp;
        request.ClsAlmId = cls;
        request.IteAlmId = ite;
        var response = await _paltos.GuardarItemAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Item, message = response.BaseResponse.Message });
    }

    private static (string grp, string cls, string ite) Parse(string codigo)
    {
        var parts = (codigo ?? string.Empty).Split('-', 3);
        return (
            parts.ElementAtOrDefault(0) ?? string.Empty,
            parts.ElementAtOrDefault(1) ?? string.Empty,
            parts.ElementAtOrDefault(2) ?? string.Empty
        );
    }
}
