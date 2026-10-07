using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Rrhh.Planilla.CalculoPlanilla;

[Acceso("/rrhh/planilla/calculo")]
public class IndexModel : PageModel
{
    private readonly RrhhApi _rrhh;
    private readonly IErpSessionAccessor _session;

    public IndexModel(RrhhApi rrhh, IErpSessionAccessor session)
    {
        _rrhh = rrhh;
        _session = session;
    }

    public string EmpresaId => _session.Current.EmpresaId;
    public bool EsCentral => EmpresaId == "02";
    public bool MotorDisponible => EmpresaId is "05" or "06";

    public void OnGet()
    {
        ViewData["shellFill"] = true;
    }

    public async Task<IActionResult> OnPostPrevisualizarAsync([FromBody] CalculoPlanillaPreviewRequest request)
    {
        try
        {
            var response = await _rrhh.PrevisualizarPlanillaAsync(request);
            return new JsonResult(new
            {
                success = response.BaseResponse.Success,
                message = response.BaseResponse.Message,
                motorDisponible = response.MotorDisponible,
                secciones = response.Secciones,
                trabajadores = response.Trabajadores
            });
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostEjecutarAsync([FromBody] CalculoPlanillaEjecutarRequest request)
    {
        try
        {
            var response = await _rrhh.EjecutarPlanillaAsync(request);
            return new JsonResult(new
            {
                success = response.BaseResponse.Success,
                message = response.BaseResponse.Message,
                exito = response.Exito,
                boletas = response.Boletas,
                detalles = response.Detalles,
                log = response.Log,
                excesos = response.Excesos
            });
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostBloquearAsync([FromBody] BloquearPlanillaRequest request)
    {
        try
        {
            var response = await _rrhh.BloquearPlanillaAsync(request);
            return new JsonResult(new
            {
                success = response.BaseResponse.Success,
                message = response.BaseResponse.Message,
                bloqueadas = response.Bloqueadas
            });
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostExplicarAsync([FromBody] CalculoPlanillaPreviewRequest request)
    {
        try
        {
            var response = await _rrhh.ExplicarPlanillaAsync(request);
            return new JsonResult(new
            {
                success = response.BaseResponse.Success,
                message = response.BaseResponse.Message,
                trabId = response.TrabId,
                nombre = response.Nombre,
                seccionId = response.SeccionId,
                pasos = response.Pasos
            });
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostBoletaAsync([FromBody] CalculoPlanillaPreviewRequest request)
    {
        try
        {
            var response = await _rrhh.ObtenerBoletaAsync(request);
            return new JsonResult(new
            {
                success = response.BaseResponse.Success,
                message = response.BaseResponse.Message,
                boleta = response.Boleta
            });
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    private static string MensajeApi(ErpApiException ex)
    {
        if (string.IsNullOrWhiteSpace(ex.Message))
            return "No se pudo completar el cálculo.";
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(ex.Message);
            if (doc.RootElement.TryGetProperty("baseResponse", out var baseResponse) &&
                baseResponse.TryGetProperty("message", out var message))
                return message.GetString() ?? ex.Message;
            if (doc.RootElement.TryGetProperty("message", out var plain))
                return plain.GetString() ?? ex.Message;
        }
        catch (System.Text.Json.JsonException)
        {
        }

        return ex.Message;
    }
}
