using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Tramites;

public class DetalleModel(ErpApiClient api, IErpSessionAccessor session) : PageModel
{
    public int TramiteId { get; private set; }

    public void OnGet(int id)
    {
        TramiteId = id;
    }

    public Task<IActionResult> OnGetDatosAsync(int id) =>
        TramitePagina.Leer(api, $"api/Tramites/Obtener?empresaId={Empresa()}&usrSistema={Usuario()}&tramiteId={id}");

    public async Task<IActionResult> OnGetAdjuntoAsync(int adjuntoId)
    {
        var archivo = await api.GetArchivoAsync($"api/Tramites/Adjunto/{adjuntoId}?empresaId={Empresa()}&usrSistema={Usuario()}");
        if (archivo.Bytes is null || archivo.Bytes.Length == 0)
            return NotFound();

        return File(archivo.Bytes, archivo.ContentType ?? "application/octet-stream", archivo.FileName ?? "adjunto");
    }

    public async Task<IActionResult> OnPostResponderAsync(int id, string? comentario, string? referencia, IFormFile? archivo)
    {
        var form = Formulario(id, comentario, referencia);
        if (archivo is { Length: > 0 })
        {
            var stream = archivo.OpenReadStream();
            form.Add(new StreamContent(stream), "archivo", archivo.FileName);
        }

        return await TramitePagina.Multipart(api, "api/Tramites/Responder", form);
    }

    public Task<IActionResult> OnPostDevolverAsync([FromBody] AccionBody body) =>
        TramitePagina.Post(api, "api/Tramites/Devolver", Cuerpo(body));

    public Task<IActionResult> OnPostAnularAsync([FromBody] AccionBody body) =>
        TramitePagina.Post(api, "api/Tramites/Anular", Cuerpo(body));

    private MultipartFormDataContent Formulario(int id, string? comentario, string? referencia)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(Empresa()), "empresaId" },
            { new StringContent(TramitePagina.UsuarioPlano(session)), "usrSistema" },
            { new StringContent(id.ToString()), "tramiteId" },
            { new StringContent(comentario ?? ""), "comentario" },
            { new StringContent(referencia ?? ""), "referencia" }
        };
        return form;
    }

    private object Cuerpo(AccionBody body) => new
    {
        empresaId = Empresa(),
        usrSistema = TramitePagina.UsuarioPlano(session),
        tramiteId = body.TramiteId,
        comentario = body.Comentario
    };

    private string Empresa() => TramitePagina.Empresa(session);
    private string Usuario() => TramitePagina.Usuario(session);

    public sealed class AccionBody
    {
        public int TramiteId { get; set; }
        public string? Comentario { get; set; }
    }
}
