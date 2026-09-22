using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ErpAndahuasi.Security;

namespace ErpAndahuasi.Pages.Paltos.Fertilizacion;

[Acceso("/paltos/fertilizacion/presupuesto")]
public class ProgramasModel : PageModel
{
    public IActionResult OnGet(long? campoCampaniaId)
    {
        var qs = campoCampaniaId is > 0 ? $"?campoCampaniaId={campoCampaniaId}" : string.Empty;
        return Redirect("/paltos/fertilizacion/presupuesto" + qs);
    }
}
