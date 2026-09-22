using ErpAndahuasi.Api;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Paltos.Fertilizacion.Control;

[Acceso("/paltos/fertilizacion/control")]
public class SalidasModel : PageModel
{
    private readonly PaltosApi _paltos;

    public SalidasModel(PaltosApi paltos) => _paltos = paltos;

    public Models.DetalleSalidasFertilizacionDto? Detalle { get; private set; }
    public string? ErrorMessage { get; private set; }
    public long CampoCampaniaId { get; private set; }

    public async Task OnGetAsync(long campoCampaniaId, int? anio, int? mes)
    {
        CampoCampaniaId = campoCampaniaId;
        try
        {
            var response = await _paltos.GetDetalleSalidasAsync(campoCampaniaId, anio, mes);
            Detalle = response.Detalle;
            if (!response.BaseResponse.Success)
                ErrorMessage = response.BaseResponse.Message;
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
    }
}
