using System.Text.Json.Nodes;
using ErpAndahuasi.Api;
using ErpAndahuasi.Menu;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Rrhh.Organigrama;

/// <summary>
/// Organigrama de Gestión: un solo árbol con el personal de la agraria y de todas las partner.
/// El árbol trae solo conteos; las personas de una unidad se piden al abrirla.
/// </summary>
[Acceso("/rrhh/organigrama")]
public class IndexModel : PageModel
{
    /// <summary>No cuelga de /rrhh/organigrama: el menú concede las subrutas de una URL permitida.</summary>
    public const string AccesoEdicion = "/rrhh/organigrama-edicion";

    private readonly RrhhApi _rrhh;
    private readonly IMenuProvider _menu;

    public IndexModel(RrhhApi rrhh, IMenuProvider menu)
    {
        _rrhh = rrhh;
        _menu = menu;
    }

    public bool PuedeEditar { get; private set; }

    public async Task OnGetAsync()
    {
        ViewData["shellFill"] = true;
        PuedeEditar = await _menu.CanAccessAsync(AccesoEdicion);
    }

    public Task<IActionResult> OnGetArbolAsync() => Responder(_rrhh.GetOrganigramaArbolAsync);

    public Task<IActionResult> OnGetUnidadAsync(int id) => Responder(() => _rrhh.GetOrganigramaUnidadAsync(id));

    /// <summary>MOF vigente; el borrador solo se pide si el usuario puede editar.</summary>
    public async Task<IActionResult> OnGetMofAsync(int id)
    {
        var editar = await _menu.CanAccessAsync(AccesoEdicion);
        return await Responder(() => _rrhh.GetOrganigramaMofAsync(id, editar));
    }

    /* Mantenimiento: la API vuelve a exigir el acceso de edición; aquí se corta antes. */

    public Task<IActionResult> OnPostMofAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Mof", body));

    public Task<IActionResult> OnPostAprobarMofAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Mof/Aprobar", body));

    public Task<IActionResult> OnGetPersonalAsync(string? q) => Editar(() => _rrhh.BuscarPersonalOrganigramaAsync(q));

    public Task<IActionResult> OnPostPuestoAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Puesto", body));

    public Task<IActionResult> OnPostPuestosDesdeCargosAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Puesto/DesdeCargos", body));

    public Task<IActionResult> OnPostAsignarAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Asignacion", body));

    public Task<IActionResult> OnPostTerminarAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Asignacion/Terminar", body));

    public Task<IActionResult> OnGetGdsAsync() => Editar(_rrhh.GetOrganigramaGdsAsync);

    public Task<IActionResult> OnPostUnidadAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Unidad", body));

    public Task<IActionResult> OnPostAgregarCriterioAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Unidad/Criterio", body));

    public Task<IActionResult> OnPostQuitarCriterioAsync([FromBody] JsonObject body) => Editar(() => _rrhh.OrganigramaPostAsync("Unidad/Criterio/Quitar", body));

    private async Task<IActionResult> Editar(Func<Task<OrganigramaResponse>> llamada)
    {
        if (!await _menu.CanAccessAsync(AccesoEdicion))
            return new JsonResult(new { success = false, message = "No tiene acceso para mantener el organigrama." }) { StatusCode = 403 };
        return await Responder(llamada);
    }

    private static async Task<IActionResult> Responder(Func<Task<OrganigramaResponse>> llamada)
    {
        try
        {
            var r = await llamada();
            return new JsonResult(new { success = r.BaseResponse.Success, message = r.BaseResponse.Message, datos = r.Datos });
        }
        catch (ErpApiException ex)
        {
            var mensaje = ex.StatusCode == 403
                ? "No tiene acceso a esta opción del organigrama."
                : "No se pudo completar la operación del organigrama.";
            return new JsonResult(new { success = false, message = mensaje }) { StatusCode = ex.StatusCode is >= 400 and < 600 ? ex.StatusCode : 500 };
        }
    }
}
