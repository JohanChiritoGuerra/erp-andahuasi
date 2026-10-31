using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Tramites;

public class NuevoModel(ErpApiClient api, IErpSessionAccessor session) : PageModel
{
    public void OnGet() { }

    public Task<IActionResult> OnGetBuscarAsync(string texto) =>
        TramitePagina.Leer(api, $"api/Tramites/Buscar?empresaId={Empresa()}&usrSistema={Usuario()}&texto={Uri.EscapeDataString(texto ?? "")}");

    public Task<IActionResult> OnGetFichaAsync(string id) =>
        TramitePagina.Leer(api, $"api/Tramites/Liquidacion?empresaId={Empresa()}&usrSistema={Usuario()}&id={Uri.EscapeDataString(id ?? "")}");

    public Task<IActionResult> OnPostCrearAsync([FromBody] CrearBody body) =>
        TramitePagina.Post(api, "api/Tramites/Crear", new
        {
            empresaId = Empresa(),
            usrSistema = TramitePagina.UsuarioPlano(session),
            liqAsocCabId = body.LiqAsocCabId,
            servicioCodigo = body.ServicioCodigo,
            comentario = body.Comentario
        });

    private string Empresa() => TramitePagina.Empresa(session);
    private string Usuario() => TramitePagina.Usuario(session);

    public sealed class CrearBody
    {
        public string LiqAsocCabId { get; set; } = "";
        public string ServicioCodigo { get; set; } = "";
        public string? Comentario { get; set; }
    }
}
