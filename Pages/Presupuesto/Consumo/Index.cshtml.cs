using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Presupuesto.Consumo;

public class IndexModel(ErpApiClient api, IErpSessionAccessor session) : PageModel
{
    public void OnGet()
    {
        ViewData["shellFill"] = true;
    }

    public Task<IActionResult> OnGetBandejaAsync(int anio, string mirada) =>
        Leer($"api/Presupuesto/Consumo/Bandeja?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&mirada={Uri.EscapeDataString(mirada ?? "centros")}");

    private string Empresa() => session.Current.EmpresaId;
    private string Usuario() => Uri.EscapeDataString(session.Current.UsuaId);

    private async Task<IActionResult> Leer(string ruta)
    {
        try
        {
            return new JsonResult(await api.GetAsync<object>(ruta));
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { baseResponse = new { success = false, message = ex.Message } });
        }
    }

}
