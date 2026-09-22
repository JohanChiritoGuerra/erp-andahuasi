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
}
