using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Administracion;

[Acceso("/administracion/modulos")]
public class ModulosModel : PageModel
{
    private readonly SistemaApi _sistema;

    public ModulosModel(SistemaApi sistema) => _sistema = sistema;

    public async Task<IActionResult> OnGetListaAsync()
    {
        var response = await _sistema.GetModulosAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Modulos, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostGuardarAsync([FromBody] GuardarModuloRequest request)
    {
        var response = await _sistema.GuardarModuloAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Modulo, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostDeshabilitarAsync([FromBody] IdRequest request)
    {
        var response = await _sistema.DeshabilitarModuloAsync(request.Id);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public async Task<IActionResult> OnPostEliminarAsync([FromBody] IdRequest request)
    {
        var response = await _sistema.EliminarModuloAsync(request.Id);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public class IdRequest
    {
        public int Id { get; set; }
        public int ModuloId { get; set; }
        public int CategoriaId { get; set; }
    }
}
