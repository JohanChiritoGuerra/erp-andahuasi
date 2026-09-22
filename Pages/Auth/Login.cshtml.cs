using ErpAndahuasi.Auth;
using ErpAndahuasi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ErpAndahuasi.Pages.Auth;

[AllowAnonymous]
public class LoginModel : PageModel
{
    private readonly IAuthClient _auth;
    private readonly ITenantResolver _tenants;
    private readonly IErpSignInService _signIn;

    public LoginModel(IAuthClient auth, ITenantResolver tenants, IErpSignInService signIn)
    {
        _auth = auth;
        _tenants = tenants;
        _signIn = signIn;
    }

    [BindProperty] public string Usuario { get; set; } = string.Empty;
    [BindProperty] public string Password { get; set; } = string.Empty;
    [BindProperty] public bool RememberMe { get; set; }
    public string? ErrorMessage { get; set; }
    public TenantInfo Tenant { get; private set; } = Tenants.Resolve("02");
    public bool SessionExpired { get; set; }

    public IActionResult OnGet(string? redirectTo, bool expired = false)
    {
        if (User.Identity?.IsAuthenticated == true)
            return Redirect(string.IsNullOrWhiteSpace(redirectTo) ? "/rrhh/perfil" : redirectTo);

        Tenant = Tenants.Resolve(_tenants.ResolveEmpresaId(HttpContext));
        SessionExpired = expired;
        if (expired)
            ErrorMessage = "Su sesión ha expirado. Por favor inicie sesión nuevamente.";

        return Page();
    }

    public async Task<IActionResult> OnPostAsync(string? redirectTo, CancellationToken ct)
    {
        Tenant = Tenants.Resolve(_tenants.ResolveEmpresaId(HttpContext));
        var usuario = Usuario?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(usuario) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Ingrese usuario y contraseña.";
            return Page();
        }

        if (usuario.All(char.IsDigit) || !usuario.All(char.IsLetterOrDigit) || !usuario.Any(char.IsLetter))
        {
            ErrorMessage = "Ingrese un usuario alfanumérico; no se admite DNI ni códigos numéricos.";
            return Page();
        }

        var empresaId = _tenants.ResolveEmpresaId(HttpContext);
        if (string.IsNullOrWhiteSpace(empresaId))
        {
            ErrorMessage = "El dominio no tiene un tenant ERP configurado.";
            return Page();
        }

        var (data, error) = await _auth.LoginWebAsync(usuario, Password, empresaId, ct);
        if (data is null)
        {
            ErrorMessage = error ?? "Error al iniciar sesión.";
            return Page();
        }

        if (string.IsNullOrWhiteSpace(data.RefreshToken))
        {
            ErrorMessage = "Auth no entregó un refresh token al ERP. Verifique AUTH_BFF_CLIENT_SECRET.";
            return Page();
        }

        var scope = data.User.AppScope ?? string.Empty;
        if (!scope.Split(' ', StringSplitOptions.RemoveEmptyEntries).Contains("erp", StringComparer.OrdinalIgnoreCase))
        {
            ErrorMessage = "El usuario no tiene acceso autorizado al ERP. Contacte al Dpto. de Sistemas.";
            return Page();
        }

        await _signIn.SignInAsync(HttpContext, data, empresaId, RememberMe);
        var target = string.IsNullOrWhiteSpace(redirectTo) || !redirectTo.StartsWith('/') ? "/rrhh/perfil" : redirectTo;
        return LocalRedirect(target);
    }
}
