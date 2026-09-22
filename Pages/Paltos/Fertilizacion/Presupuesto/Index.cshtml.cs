using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Paltos.Fertilizacion.Presupuesto;

[Acceso("/paltos/fertilizacion/presupuesto")]
public class IndexModel : PageModel
{
    private readonly PaltosApi _paltos;

    public IndexModel(PaltosApi paltos) => _paltos = paltos;

    public async Task<IActionResult> OnGetCampaniasAsync()
    {
        var response = await _paltos.GetCampaniasFertilizacionAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campanias, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetDataAsync(long campoCampaniaId)
    {
        var response = await _paltos.GetPresupuestoAsync(campoCampaniaId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Presupuesto, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostGuardarAsync([FromBody] GuardarPresupuestoFertilizacionRequest request)
    {
        var response = await _paltos.GuardarPresupuestoAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Presupuesto, message = response.BaseResponse.Message });
    }
}
