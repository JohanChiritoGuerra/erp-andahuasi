using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Paltos.Fertilizacion.ConfiguracionItems;

[Acceso("/paltos/fertilizacion/configuracion-items")]
public class ItemModel : PageModel
{
    private readonly PaltosApi _paltos;

    public ItemModel(PaltosApi paltos) => _paltos = paltos;

    public ItemFertilizacionConfiguracionDto? Item { get; private set; }
    public List<ElementoQuimicoDto> Elementos { get; private set; } = [];
    public string? ErrorMessage { get; private set; }
    public string Grp { get; private set; } = string.Empty;
    public string Cls { get; private set; } = string.Empty;
    public string Ite { get; private set; } = string.Empty;

    public async Task OnGetAsync(string codigo)
    {
        Parse(codigo);
        try
        {
            var item = await _paltos.GetItemAsync(Grp, Cls, Ite);
            Item = item.Item;
            Elementos = (await _paltos.GetElementosAsync()).Elementos;
            if (!item.BaseResponse.Success)
                ErrorMessage = item.BaseResponse.Message;
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
    }

    public async Task<IActionResult> OnPostGuardarAsync(string codigo, [FromBody] GuardarItemFertilizacionRequest request)
    {
        Parse(codigo);
        request.GrpAlmId = Grp;
        request.ClsAlmId = Cls;
        request.IteAlmId = Ite;
        var response = await _paltos.GuardarItemAsync(request);
        return new JsonResult(new { success = response.BaseResponse.Success, data = response.Item, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnPostImagenAsync(string codigo, IFormFile archivo)
    {
        Parse(codigo);
        await using var stream = archivo.OpenReadStream();
        var response = await _paltos.GuardarImagenItemAsync(Grp, Cls, Ite, stream, archivo.FileName);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    public async Task<IActionResult> OnPostDocumentoAsync(string codigo, IFormFile archivo, string vigenciaDesde, string tipoDocumento)
    {
        Parse(codigo);
        await using var stream = archivo.OpenReadStream();
        var response = await _paltos.CargarDocumentoAsync(Grp, Cls, Ite, vigenciaDesde, tipoDocumento, stream, archivo.FileName);
        return new JsonResult(new { success = response.BaseResponse.Success, message = response.BaseResponse.Message });
    }

    public async Task<IActionResult> OnGetImagenAsync(string codigo)
    {
        Parse(codigo);
        var bytes = await _paltos.GetImagenItemAsync(Grp, Cls, Ite);
        return bytes is null ? NotFound() : File(bytes, "image/jpeg");
    }

    public async Task<IActionResult> OnPostEliminarDocumentoAsync([FromBody] DocumentoIdRequest request)
    {
        var response = await _paltos.EliminarDocumentoAsync(request.DocumentoId);
        return new JsonResult(new { success = response.Success, message = response.Message });
    }

    private void Parse(string codigo)
    {
        var parts = (codigo ?? string.Empty).Split('-', 3);
        Grp = parts.ElementAtOrDefault(0) ?? string.Empty;
        Cls = parts.ElementAtOrDefault(1) ?? string.Empty;
        Ite = parts.ElementAtOrDefault(2) ?? string.Empty;
    }

    public class DocumentoIdRequest
    {
        public long DocumentoId { get; set; }
    }
}
