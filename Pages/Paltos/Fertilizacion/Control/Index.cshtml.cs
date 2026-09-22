using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Paltos.Fertilizacion.Control;

[Acceso("/paltos/fertilizacion/control")]
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
        var response = await _paltos.GetControlAsync(campoCampaniaId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Control, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostCerrarAsync(long campoCampaniaId, [FromBody] CerrarMesFertilizacionRequest request)
    {
        var response = await _paltos.CerrarMesAsync(campoCampaniaId, request.Anio, request.Mes);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Control, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostReabrirAsync(long campoCampaniaId, [FromBody] CerrarMesFertilizacionRequest request)
    {
        var response = await _paltos.ReabrirMesAsync(campoCampaniaId, request.Anio, request.Mes, request.Motivo ?? string.Empty);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Control, message = response.BaseResponse.Message });
    }
}
