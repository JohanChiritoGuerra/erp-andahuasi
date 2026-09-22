using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Administracion;

[Acceso("/administracion/accesos")]
public class AccesosModel : PageModel
{
    private readonly SistemaApi _sistema;

    public AccesosModel(SistemaApi sistema) => _sistema = sistema;

    public async Task<IActionResult> OnGetListaAsync()
    {
        var response = await _sistema.GetAccesosAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Accesos, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetLookupsAsync()
    {
        var modulos = await _sistema.GetModulosAsync();
        var categorias = await _sistema.GetCategoriasAsync();
        return new JsonResult(new { success = true, modulos = modulos.Modulos, categorias = categorias.Categorias });
    }

    public async Task<IActionResult> OnPostGuardarAsync([FromBody] GuardarAccesoRequest request)
    {
        var response = await _sistema.GuardarAccesoAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Acceso, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostEliminarAsync([FromBody] GuardarAccesoRequest request)
    {
        var response = await _sistema.EliminarAccesoAsync(request.AccesoId ?? 0, request.CategoriaId, request.ModuloId);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public async Task<IActionResult> OnGetRolesAsync(int accesoId, int categoriaId, int moduloId)
    {
        var response = await _sistema.GetAccesosPorRolAsync(accesoId, categoriaId, moduloId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Data ?? [], message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostRolAccesoAsync([FromBody] ActualizarRolAccesoFlagsRequest request)
    {
        var response = await _sistema.ActualizarRolAccesoAsync(request);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public async Task<IActionResult> OnGetDirectosAsync(int accesoId, int categoriaId, int moduloId)
    {
        var response = await _sistema.GetUsuariosDirectosAsync(accesoId, categoriaId, moduloId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Data ?? [], message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostDirectoAsync([FromBody] AccesoDirectoRequest request)
    {
        var response = await _sistema.AsignarAccesoDirectoAsync(request);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }
}
