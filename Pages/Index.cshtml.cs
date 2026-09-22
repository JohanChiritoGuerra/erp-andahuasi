using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages;

public class IndexModel : PageModel
{
    public IActionResult OnGet() => Redirect("/rrhh/perfil");
}
