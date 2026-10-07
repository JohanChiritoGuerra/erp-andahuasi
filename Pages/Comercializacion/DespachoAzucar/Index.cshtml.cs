using System.Text.Json;
using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Comercializacion.DespachoAzucar;

[Acceso("/comercializacion/despacho-azucar")]
public class IndexModel : PageModel
{
    private readonly ComercializacionApi _comercializacion;

    public IndexModel(ComercializacionApi comercializacion)
    {
        _comercializacion = comercializacion;
    }

    public void OnGet()
    {
        ViewData["shellFill"] = true;
    }

    public async Task<IActionResult> OnPostPorDespacharAsync([FromBody] AzucarListadoQuery query)
    {
        try
        {
            var response = await _comercializacion.PorDespacharAsync(Articulo(query.IdArticulo));
            return JsonOk(response.BaseResponse, response.ItemsPorDespachar.Select(x => new
            {
                idFactdetal = x.Id_factdetal,
                fecha = x.FECHA,
                cliente = x.CLIENTE,
                tipo = x.TIPO,
                dniRuc = x.DNI_RUC,
                condicion = x.CONDICION,
                comprobante = x.COMPROBANTE,
                producto = x.DESCRIPCION,
                cantidad = x.CANTIDAD
            }));
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostDespacharAsync([FromBody] AzucarDespacharCommand command)
    {
        if (command.IdFactdetal <= 0)
            return new JsonResult(new { success = false, message = "Seleccione un comprobante." });

        try
        {
            var response = await _comercializacion.DespacharAsync(command.IdFactdetal, command.Fecha);
            return new JsonResult(new { success = response.BaseResponse.Success, message = response.BaseResponse.Message });
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostOrdenesAsync([FromBody] AzucarListadoQuery query)
    {
        try
        {
            var response = await _comercializacion.OrdenesInternasAsync(Articulo(query.IdArticulo));
            return JsonOk(response.BaseResponse, response.ItemsOrdenInterna.Select(x => new
            {
                idInvmaest = x.Id_invmaest,
                numero = x.Numero,
                fecha = x.Fecha,
                cantidad = x.Cantidad,
                producto = x.Producto,
                destino = x.Destino
            }));
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostRegistrarAsync([FromBody] AzucarRegistrarCommand command)
    {
        try
        {
            var response = await _comercializacion.RegistrarOrdenAsync(command);
            return new JsonResult(new { success = response.BaseResponse.Success, message = response.BaseResponse.Message });
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostDespachadosAsync([FromBody] AzucarDespachadosQuery query)
    {
        var fecha = query.Fecha == default ? DateTime.Today : query.Fecha;
        try
        {
            var response = await _comercializacion.DespachadosAsync(Articulo(query.IdArticulo), fecha, query.TodoElMes);
            return JsonOk(response.BaseResponse, response.ItemsDespachados.Select(x => new
            {
                idInvmaest = x.Id_invmaest,
                fecha = x.FECHA,
                fechaAtencion = x.FECHA_ATENCION,
                cliente = x.CLIENTE,
                tipo = x.TIPO,
                dniRuc = x.DNI_RUC,
                condicion = x.CONDICION,
                comprobante = x.COMPROBANTE,
                producto = x.DESCRIPCION,
                cantidad = x.CANTIDAD
            }));
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    public async Task<IActionResult> OnPostAnularAsync([FromBody] AzucarAnularCommand command)
    {
        if (command.IdInvmaest <= 0)
            return new JsonResult(new { success = false, message = "Este despacho no tiene un movimiento para anular." });

        try
        {
            var response = await _comercializacion.AnularDespachoAsync(command.IdInvmaest);
            return new JsonResult(new { success = response.BaseResponse.Success, message = response.BaseResponse.Message });
        }
        catch (ErpApiException ex)
        {
            return new JsonResult(new { success = false, message = MensajeApi(ex) });
        }
    }

    private static int Articulo(int idArticulo) => idArticulo > 0 ? idArticulo : 2;

    private static JsonResult JsonOk(BaseResponse baseResponse, object items) =>
        new(new
        {
            success = baseResponse.Success,
            message = baseResponse.Message,
            items
        });

    private static string MensajeApi(ErpApiException ex)
    {
        if (string.IsNullOrWhiteSpace(ex.Message))
            return "No se pudo completar la operación.";

        try
        {
            using var doc = JsonDocument.Parse(ex.Message);
            var root = doc.RootElement;
            if (root.TryGetProperty("baseResponse", out var baseResponse))
            {
                var errores = Textos(baseResponse, "errores");
                if (errores.Length > 0)
                    return errores;
                if (baseResponse.TryGetProperty("message", out var message) && message.GetString() is { Length: > 0 } texto)
                    return texto;
            }

            var planos = Textos(root, "errores");
            if (planos.Length > 0)
                return planos;
            if (root.TryGetProperty("message", out var plain) && plain.GetString() is { Length: > 0 } suelto)
                return suelto;
        }
        catch (JsonException)
        {
        }

        return ex.Message;
    }

    private static string Textos(JsonElement padre, string nombre)
    {
        if (!padre.TryGetProperty(nombre, out var lista) || lista.ValueKind != JsonValueKind.Array)
            return string.Empty;

        return string.Join(" ", lista.EnumerateArray()
            .Select(item => item.GetString())
            .Where(texto => !string.IsNullOrWhiteSpace(texto))!);
    }
}
