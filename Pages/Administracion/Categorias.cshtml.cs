using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Administracion;

[Acceso("/administracion/categorias")]
public class CategoriasModel : PageModel
{
    private readonly SistemaApi _sistema;

    public CategoriasModel(SistemaApi sistema) => _sistema = sistema;

    public async Task<IActionResult> OnGetListaAsync()
    {
        var response = await _sistema.GetCategoriasAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Categorias, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetModulosAsync()
    {
        var response = await _sistema.GetModulosAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Modulos });
    }

    public async Task<IActionResult> OnPostGuardarAsync([FromBody] GuardarCategoriaRequest request)
    {
        var response = await _sistema.GuardarCategoriaAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Categoria, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostEliminarAsync([FromBody] GuardarCategoriaRequest request)
    {
        var response = await _sistema.EliminarCategoriaAsync(request.CategoriaId ?? 0, request.ModuloId);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }
}
