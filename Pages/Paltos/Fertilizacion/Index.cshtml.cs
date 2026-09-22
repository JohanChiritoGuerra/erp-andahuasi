using ErpAndahuasi.Api;
using ErpAndahuasi.Models;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Paltos.Fertilizacion;

[Acceso("/paltos/fertilizacion")]
public class IndexModel : PageModel
{
    private readonly PaltosApi _paltos;

    public IndexModel(PaltosApi paltos) => _paltos = paltos;

    public List<CampaniaCampoDto> Campanias { get; private set; } = [];
    public List<MovimientoFertilizacionSinCampaniaDto> Incidencias { get; private set; } = [];
    public string? ErrorMessage { get; private set; }

    public async Task OnGetAsync()
    {
        try
        {
            var response = await _paltos.GetCampaniasFertilizacionAsync();
            Campanias = response.Campanias ?? [];
            Incidencias = response.Incidencias ?? [];
            if (!response.BaseResponse.Success)
                ErrorMessage = response.BaseResponse.Message;
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
    }
}
