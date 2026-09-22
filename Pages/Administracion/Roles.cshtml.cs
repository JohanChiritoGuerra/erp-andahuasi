using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Administracion;

[Acceso("/administracion/roles")]
public class RolesModel : PageModel
{
    private readonly SistemaApi _sistema;

    public RolesModel(SistemaApi sistema) => _sistema = sistema;

    public async Task<IActionResult> OnGetListaAsync()
    {
        var response = await _sistema.GetRolesAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Roles, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostGuardarAsync([FromBody] ActualizarRolRequest request)
    {
        object response = request.RolId > 0
            ? await _sistema.ActualizarRolAsync(request)
            : await _sistema.CrearRolAsync(request);
        var typed = (RolResponse)response;
        return new JsonResult(new { success = typed.BaseResponse.Success, data = typed.Rol, message = typed.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostEliminarAsync([FromBody] ActualizarRolRequest request)
    {
        var response = await _sistema.EliminarRolAsync(request.RolId);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public async Task<IActionResult> OnPostClonarAsync([FromBody] ClonarRolRequest request)
    {
        var response = await _sistema.ClonarRolAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Rol, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetPermisosAsync(int rolId)
    {
        var response = await _sistema.GetPermisosRolAsync(rolId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostPermisosAsync([FromBody] GuardarPermisosRolRequest request)
    {
        var response = await _sistema.GuardarPermisosRolAsync(request);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public async Task<IActionResult> OnGetUsuariosAsync(int rolId)
    {
        var response = await _sistema.GetUsuariosPorRolAsync(rolId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Usuarios, message = response.BaseResponse.Message });
    }
}
