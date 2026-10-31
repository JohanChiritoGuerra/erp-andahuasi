using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Tramites;

public class IndexModel(ErpApiClient api, IErpSessionAccessor session) : PageModel
{
    public void OnGet() => ViewData["shellFill"] = true;

    public Task<IActionResult> OnGetBandejaAsync(string? mirada, string? texto) =>
        TramitePagina.Leer(api, $"api/Tramites/Bandeja?empresaId={Empresa()}&usrSistema={Usuario()}&mirada={Uri.EscapeDataString(mirada ?? "accion")}&texto={Uri.EscapeDataString(texto ?? "")}");

    public Task<IActionResult> OnGetAvisosAsync() =>
        TramitePagina.Leer(api, $"api/Tramites/Avisos?empresaId={Empresa()}&usrSistema={Usuario()}");

    public Task<IActionResult> OnPostAvisosLeerAsync() =>
        TramitePagina.Post(api, "api/Tramites/Avisos/Leer", new { empresaId = Empresa(), usrSistema = TramitePagina.UsuarioPlano(session) });

    private string Empresa() => TramitePagina.Empresa(session);
    private string Usuario() => TramitePagina.Usuario(session);
}
