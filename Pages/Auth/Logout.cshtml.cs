using ErpAndahuasi.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Auth;

public class LogoutModel : PageModel
{
    private readonly IErpSignInService _signIn;

    public LogoutModel(IErpSignInService signIn)
    {
        _signIn = signIn;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        await _signIn.SignOutAsync(HttpContext);
        return RedirectToPage("/Auth/Login");
    }
}
