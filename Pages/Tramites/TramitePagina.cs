using System.Text.Json;
using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;

namespace ErpAndahuasi.Pages.Tramites;

internal static class TramitePagina
{
    public static string Empresa(IErpSessionAccessor session) => session.Current.EmpresaId;
    public static string Usuario(IErpSessionAccessor session) => Uri.EscapeDataString(session.Current.UsuaId);
    public static string UsuarioPlano(IErpSessionAccessor session) => session.Current.UsuaId;

    public static async Task<IActionResult> Leer(ErpApiClient api, string ruta)
    {
        try
        {
            return new JsonResult(await api.GetAsync<object>(ruta));
        }
        catch (ErpApiException ex)
        {
            return Fallo(ex.Message);
        }
    }

    public static async Task<IActionResult> Post(ErpApiClient api, string ruta, object body)
    {
        try
        {
            return new JsonResult(await api.PostAsync<object>(ruta, body));
        }
        catch (ErpApiException ex)
        {
            return Fallo(ex.Message);
        }
    }

    public static async Task<IActionResult> Multipart(ErpApiClient api, string ruta, MultipartFormDataContent form)
    {
        try
        {
            return new JsonResult(await api.SendMultipartAsync<object>(HttpMethod.Post, ruta, form));
        }
        catch (ErpApiException ex)
        {
            return Fallo(ex.Message);
        }
    }

    public static JsonResult Fallo(string raw) =>
        new(new { baseResponse = new { success = false, message = Texto(raw) } });

    public static string Texto(string raw)
    {
        try
        {
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.TryGetProperty("baseResponse", out var br)
                && br.TryGetProperty("message", out var mensaje)
                && mensaje.ValueKind == JsonValueKind.String)
                return mensaje.GetString() ?? raw;
        }
        catch (JsonException)
        {
        }

        return raw;
    }
}
