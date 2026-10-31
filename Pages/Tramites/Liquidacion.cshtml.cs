using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Tramites;

public class LiquidacionModel(ErpApiClient api, IErpSessionAccessor session) : PageModel
{
    public string Ancla { get; private set; } = "";

    public void OnGet(string ancla) => Ancla = ancla;

    public Task<IActionResult> OnGetDatosAsync(string ancla) =>
        TramitePagina.Leer(api, $"api/Tramites/Liquidacion?empresaId={TramitePagina.Empresa(session)}&usrSistema={TramitePagina.Usuario(session)}&id={Uri.EscapeDataString(ancla ?? "")}");
}
