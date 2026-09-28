using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Paltos.CamposCampanias;

[Acceso("/paltos/campos-campanias")]
public class DetalleModel : PageModel
{
    private readonly PaltosApi _paltos;

    public DetalleModel(PaltosApi paltos) => _paltos = paltos;

    public CampoPaltoDto? Campo { get; private set; }
    public long CampoPaltoId { get; private set; }
    public string? ErrorMessage { get; private set; }

    public async Task OnGetAsync(long campoPaltoId)
    {
        CampoPaltoId = campoPaltoId;
        try
        {
            var response = await _paltos.GetCampoAsync(campoPaltoId);
            Campo = response.Campo;
            if (!response.BaseResponse.Success)
                ErrorMessage = response.BaseResponse.Message;
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
    }

    public async Task<IActionResult> OnPostCampaniaAsync([FromBody] CrearCampaniaCampoRequest request)
    {
        var response = await _paltos.CrearCampaniaAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campania, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostAccionAsync(long campoCampaniaId, string accion, [FromBody] AccionCampaniaRequest request)
    {
        var response = await _paltos.AccionarCampaniaAsync(campoCampaniaId, accion, request.Motivo);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campania, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostReimportarAsync(long campoCampaniaId, [FromBody] ReimportarPresupuestoCampaniaRequest request)
    {
        var response = await _paltos.ReimportarPresupuestoAsync(campoCampaniaId, request.CampoCampaniaFuenteId);
        return new JsonResult(new { success = response.BaseResponse.Success, message = response.BaseResponse.Message });
    }
}
