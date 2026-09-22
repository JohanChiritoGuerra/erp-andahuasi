using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Administracion;

[Acceso("/administracion/usuarios")]
public class UsuariosModel : PageModel
{
    private readonly SistemaApi _sistema;

    public UsuariosModel(SistemaApi sistema) => _sistema = sistema;

    public async Task<IActionResult> OnGetListaAsync()
    {
        var response = await _sistema.GetUsuariosAsync();
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Usuarios, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetRolesAsync(string usuaId)
    {
        var response = await _sistema.GetRolesPorUsuarioAsync(usuaId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Roles, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostRolesAsync([FromBody] AsignarRolesUsuarioRequest request)
    {
        var response = await _sistema.GuardarRolesUsuarioAsync(request);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public async Task<IActionResult> OnGetAccesosAsync(string usuaId)
    {
        var response = await _sistema.GetAccesosUsuarioAsync(usuaId);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Accesos, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostCopiarAsync(string usuaDestinoId, [FromBody] CopiarAccesosRequest request)
    {
        var response = await _sistema.CopiarAccesosAsync(usuaDestinoId, request);
        return new JsonResult(new { success = response.BaseResponse.Success, message = response.BaseResponse.Message, data = response });
    }
}
