using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages;

[AllowAnonymous]
public class ErrorModel : PageModel
{
    public int Code { get; set; }

    public void OnGet(int code = 500)
    {
        Code = code;
    }
}
