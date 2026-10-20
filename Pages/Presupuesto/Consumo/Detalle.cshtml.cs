using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Presupuesto.Consumo;

public class DetalleModel(ErpApiClient api, IErpSessionAccessor session) : PageModel
{
    public int Anio { get; private set; }
    public string Correlativo { get; private set; } = "";

    public void OnGet(int anio, string correlativo)
    {
        Anio = anio;
        Correlativo = correlativo;
        ViewData["shellFill"] = true;
    }

    public Task<IActionResult> OnGetDocumentoAsync(int anio, string correlativo) =>
        Leer($"api/Presupuesto/Consumo/Detalle?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&correlativo={Uri.EscapeDataString(correlativo)}");

    public Task<IActionResult> OnGetItemsAsync(int anio, string texto) =>
        Leer($"api/Presupuesto/Consumo/BuscarItems?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&texto={Uri.EscapeDataString(texto ?? "")}");

    public Task<IActionResult> OnGetPrecioAsync(int anio, string codigo) =>
        Leer($"api/Presupuesto/Consumo/PrecioItem?empresaId={Empresa()}&usrSistema={Usuario()}&anio={anio}&codigo={Uri.EscapeDataString(codigo)}");

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

    public Task<IActionResult> OnPostEliminarAsync([FromBody] EliminarMaterial comando) =>
        Enviar("api/Presupuesto/Consumo/EliminarItem", new
        {
            EmpresaId = Empresa(),
            UsrSistema = Usuario(),
            comando.Anio,
            comando.Correlativo,
            comando.Codigo
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

    public class GuardarMaterial
    {
        public int Anio { get; set; }
        public string Correlativo { get; set; } = "";
        public string Codigo { get; set; } = "";
        public List<decimal> Cantidades { get; set; } = [];
    }

    public class EliminarMaterial
    {
        public int Anio { get; set; }
        public string Correlativo { get; set; } = "";
        public string Codigo { get; set; } = "";
    }
}
