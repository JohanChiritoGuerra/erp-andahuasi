using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Rrhh;

[Acceso("/rrhh/perfil")]
public class PerfilModel : PageModel
{
    private readonly RrhhApi _rrhh;

    public PerfilModel(RrhhApi rrhh)
    {
        _rrhh = rrhh;
    }

    public TrabajadorModel? Perfil { get; private set; }
    public string? ErrorMessage { get; private set; }

    public async Task OnGetAsync()
    {
        try
        {
            var response = await _rrhh.GetPerfilAsync();
            if (response.BaseResponse.Success)
                Perfil = response.PerfilTrabajador;
            else
                ErrorMessage = response.BaseResponse.Message ?? "Error al cargar el perfil.";
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
    }
}
