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

    public Task<IActionResult> OnGetCentrosAsync(int anio, string texto) =>
        Leer($"api/Presupuesto/Consumo/BuscarCentros?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&texto={Uri.EscapeDataString(texto ?? "")}");

    public Task<IActionResult> OnPostCrearAsync([FromBody] CrearPresupuesto comando) =>
        Enviar("api/Presupuesto/Consumo/Crear", new
        {
            EmpresaId = Empresa(),
            UsrSistema = Usuario(),
            comando.Anio,
            comando.Descripcion,
            comando.CentroCosto
        });

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

    private async Task<IActionResult> Enviar(string ruta, object cuerpo)
    {
        try
        {
            return new JsonResult(await api.PostAsync<object>(ruta, cuerpo));
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { baseResponse = new { success = false, message = ex.Message } });
        }
    }

    public class CrearPresupuesto
    {
        public int Anio { get; set; }
        public string Descripcion { get; set; } = "";
        public string CentroCosto { get; set; } = "";
    }
}
