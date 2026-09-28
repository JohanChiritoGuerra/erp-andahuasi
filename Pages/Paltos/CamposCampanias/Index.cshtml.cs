using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Paltos.CamposCampanias;

[Acceso("/paltos/campos-campanias")]
public class IndexModel : PageModel
{
    private readonly PaltosApi _paltos;

    public IndexModel(PaltosApi paltos) => _paltos = paltos;

    public async Task<IActionResult> OnGetListaAsync()
    {
        var response = await _paltos.GetCamposAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campos, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetCatalogoAsync(string buscar = "")
    {
        var response = await _paltos.GetCatalogoCamposAsync(buscar);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campos, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostGuardarAsync([FromBody] GuardarCampoPaltoRequest request)
    {
        var response = await _paltos.GuardarCampoAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campo, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostEstadoAsync([FromBody] GuardarCampoPaltoRequest request)
    {
        var response = await _paltos.CambiarEstadoCampoAsync(request.CampoPaltoId ?? 0, request.Activo);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public async Task<IActionResult> OnGetPreviewAsync()
    {
        var response = await _paltos.GetPreviewReconstruccionAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campanias, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostReconstruirAsync([FromBody] ReconstruirHistoricoRequest request)
    {
        var response = await _paltos.ReconstruirHistoricoAsync(request.CodigosCampo, request.PresupuestoReferenciaCampoCampaniaId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campanias, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetCampoAsync(long id)
    {
        var response = await _paltos.GetCampoAsync(id);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campo, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetCampaniasAsync()
    {
        var response = await _paltos.GetCampaniasCampoAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campanias, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostCampaniaAsync([FromBody] CrearCampaniaCampoRequest request)
    {
        var response = await _paltos.CrearCampaniaAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campania, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostAccionAsync(long campoCampaniaId, string accion, [FromBody] AccionCampaniaRequest request)
    {
        var response = await _paltos.AccionarCampaniaAsync(campoCampaniaId, accion, request?.Motivo);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Campania, message = response.BaseResponse.Message });
    }
}
