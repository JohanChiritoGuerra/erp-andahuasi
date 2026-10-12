using System.Text.RegularExpressions;
using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using ErpAndahuasi.Menu;
using ErpAndahuasi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Rrhh.Telecredito;

/// <summary>
/// Generar archivo Telecrédito BCP. Una sola página para todas las partner: cada empresa
/// tiene su acceso de menú /rrhh/telecredito/{EmpresaId}. Por eso no usa [Acceso] fijo:
/// el permiso se valida con la URL de la empresa en cada GET y cada handler.
/// </summary>
public partial class IndexModel : PageModel
{
    public const string AccesoBase = "/rrhh/telecredito";

    private readonly RrhhApi _rrhh;
    private readonly IErpSessionAccessor _session;
    private readonly IMenuProvider _menu;

    public IndexModel(RrhhApi rrhh, IErpSessionAccessor session, IMenuProvider menu)
    {
        _rrhh = rrhh;
        _session = session;
        _menu = menu;
    }

    [BindProperty(SupportsGet = true)]
    public string EmpresaId { get; set; } = string.Empty;

    public bool EsCentral => _session.Current.EmpresaId == "02";

    public override async Task OnPageHandlerExecutionAsync(PageHandlerExecutingContext context, PageHandlerExecutionDelegate next)
    {
        // Sin sesión, ErpPageFilter (que corre después) manda al login.
        if (User.Identity?.IsAuthenticated != true)
        {
            await next();
            return;
        }

        EmpresaId = (EmpresaId ?? string.Empty).Trim();
        if (!CodigoEmpresa().IsMatch(EmpresaId) || !await _menu.CanAccessAsync($"{AccesoBase}/{EmpresaId}"))
        {
            context.Result = HttpMethods.IsPost(Request.Method)
                ? new JsonResult(new { success = false, message = "No tiene acceso a esta empresa." }) { StatusCode = 403 }
                : RedirectToPage("/Error", new { code = 401 });
            return;
        }

        await next();
    }

    public void OnGet()
    {
        ViewData["shellFill"] = true;
    }

    public Task<IActionResult> OnPostListarAsync([FromBody] TelecreditoListarRequest request) =>
        Llamar<TelecreditoListarResponse>("Listar", request, r => new { empresa = r.Empresa, operaciones = r.Operaciones });

    public Task<IActionResult> OnPostCrearAsync([FromBody] TelecreditoCrearRequest request) =>
        Llamar<TelecreditoOperacionResponse>("Crear", request, Operacion);

    public Task<IActionResult> OnPostObtenerAsync([FromBody] TelecreditoOperacionRequest request) =>
        Llamar<TelecreditoOperacionResponse>("Obtener", request, Operacion);

    public Task<IActionResult> OnPostEliminarAsync([FromBody] TelecreditoOperacionRequest request) =>
        Llamar<TelecreditoOperacionResponse>("Eliminar", request, Operacion);

    public Task<IActionResult> OnPostCandidatosAsync([FromBody] TelecreditoOperacionRequest request) =>
        Llamar<TelecreditoCandidatosResponse>("Candidatos", request, r => new { candidatos = r.Candidatos });

    public Task<IActionResult> OnPostAgregarAsync([FromBody] TelecreditoTrabajadoresRequest request) =>
        Llamar<TelecreditoOperacionResponse>("Agregar", request, Operacion);

    public Task<IActionResult> OnPostCargarMensualidadAsync([FromBody] TelecreditoOperacionRequest request) =>
        Llamar<TelecreditoOperacionResponse>("CargarMensualidad", request, Operacion);

    public Task<IActionResult> OnPostQuitarAsync([FromBody] TelecreditoTrabajadoresRequest request) =>
        Llamar<TelecreditoOperacionResponse>("Quitar", request, Operacion);

    public Task<IActionResult> OnPostCerrarAsync([FromBody] TelecreditoOperacionRequest request) =>
        Llamar<TelecreditoOperacionResponse>("Cerrar", request, Operacion);

    public Task<IActionResult> OnPostArchivosAsync([FromBody] TelecreditoOperacionRequest request) =>
        Llamar<TelecreditoArchivosResponse>("Archivos", request, r => new { archivos = r.Archivos });

    public Task<IActionResult> OnPostGenerarAsync([FromBody] TelecreditoOperacionRequest request) =>
        Llamar<TelecreditoArchivosResponse>("Generar", request, r => new { archivos = r.Archivos });

    private static object Operacion(TelecreditoOperacionResponse r) =>
        new { operacion = r.Operacion, detalle = r.Detalle, totales = r.Totales, avisos = r.Avisos };

    /// <summary>La empresa sale de la ruta, nunca del cuerpo que envía el navegador.</summary>
    private async Task<IActionResult> Llamar<T>(string accion, TelecreditoRequest? request, Func<T, object> datos)
        where T : IBaseResponse
    {
        if (request is null)
            return new JsonResult(new { success = false, message = "Solicitud vacía." });

        request.EmpresaOperacionId = EmpresaId;
        try
        {
            var response = await _rrhh.TelecreditoAsync<T>(accion, request);
            return new JsonResult(new
            {
                success = response.BaseResponse.Success,
                message = response.BaseResponse.Message,
                errores = response.BaseResponse.Errores,
                datos = datos(response)
            });
        }
        catch (ErpApiException ex)
        {
            var (mensaje, errores) = MensajeApi(ex);
            return new JsonResult(new { success = false, message = mensaje, errores });
        }
    }

    private static (string Mensaje, List<string> Errores) MensajeApi(ErpApiException ex)
    {
        var errores = new List<string>();
        if (string.IsNullOrWhiteSpace(ex.Message))
            return ("No se pudo completar la operación.", errores);
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(ex.Message);
            if (doc.RootElement.TryGetProperty("baseResponse", out var baseResponse))
            {
                if (baseResponse.TryGetProperty("errores", out var lista) && lista.ValueKind == System.Text.Json.JsonValueKind.Array)
                    errores.AddRange(lista.EnumerateArray().Select(e => e.GetString() ?? string.Empty).Where(e => e.Length > 0));
                if (baseResponse.TryGetProperty("message", out var message))
                    return (message.GetString() ?? ex.Message, errores);
            }
            if (doc.RootElement.TryGetProperty("message", out var plain))
                return (plain.GetString() ?? ex.Message, errores);
        }
        catch (System.Text.Json.JsonException)
        {
        }

        return (ex.Message, errores);
    }

    [GeneratedRegex(@"^\d{2}$")]
    private static partial Regex CodigoEmpresa();
}
