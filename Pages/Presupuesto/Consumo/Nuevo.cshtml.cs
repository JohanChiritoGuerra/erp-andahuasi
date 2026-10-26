using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Presupuesto.Consumo;

public class NuevoModel(ErpApiClient api, IErpSessionAccessor session) : PageModel
{
    public int Anio { get; private set; }

    public void OnGet(int? anio)
    {
        ViewData["shellFill"] = true;
        var hoy = DateTime.Today;
        Anio = anio is >= 2000 and <= 2100 ? anio.Value : hoy.Month >= 9 ? hoy.Year + 1 : hoy.Year;
    }

    public Task<IActionResult> OnGetTiposAsync() =>
        Leer($"api/Presupuesto/Consumo/Tipos?empresaId={Empresa()}");

    public Task<IActionResult> OnGetPeriodoAsync(int anio) =>
        Leer($"api/Presupuesto/Consumo/Periodo?empresaId={Empresa()}&anio={anio}");

    public Task<IActionResult> OnGetCentroAsync(int anio, string codigo) =>
        Leer($"api/Presupuesto/Consumo/ConsultarCentro?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&codigo={Uri.EscapeDataString(codigo ?? "")}");

    public Task<IActionResult> OnGetCentrosAsync(int anio, string texto) =>
        Leer($"api/Presupuesto/Consumo/BuscarCentros?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&texto={Uri.EscapeDataString(texto ?? "")}");

    public Task<IActionResult> OnGetItemsAsync(int anio, string texto) =>
        Leer($"api/Presupuesto/Consumo/BuscarItems?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&texto={Uri.EscapeDataString(texto ?? "")}");

    public Task<IActionResult> OnGetPrecioAsync(int anio, string codigo) =>
        Leer($"api/Presupuesto/Consumo/PrecioItem?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&codigo={Uri.EscapeDataString(codigo ?? "")}");

    public Task<IActionResult> OnPostGuardarAsync([FromBody] GuardarMaterial comando) =>
        Enviar("api/Presupuesto/Consumo/GuardarItem", new
        {
            EmpresaId = Empresa(),
            UsrSistema = Usuario(),
            comando.Anio,
            comando.Correlativo,
            comando.Codigo,
            comando.Cantidades
        });

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

    public class GuardarMaterial
    {
        public int Anio { get; set; }
        public string Correlativo { get; set; } = "";
        public string Codigo { get; set; } = "";
        public List<decimal> Cantidades { get; set; } = [];
    }
}
