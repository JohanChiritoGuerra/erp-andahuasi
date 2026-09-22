using System.Security.Claims;
using ErpAndahuasi.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace ErpAndahuasi.Auth;

public static class ErpClaimTypes
{
    public const string UsuaId = ClaimTypes.NameIdentifier;
    public const string TrabId = "trab_id";
    public const string EmpresaId = "empresa_id";
    public const string FirstName = "first_name";
    public const string PhotoUrl = "photo_url";
    public const string AccessToken = "access_token";
    public const string RefreshToken = "refresh_token";
    public const string AccessTokenExpires = "access_token_expires";
    public const string RememberMe = "remember_me";
    public const string SessionExpires = "session_expires";
}

public interface IErpSessionAccessor
{
    bool IsAuthenticated { get; }
    ErpUser Current { get; }
    string? AccessToken { get; }
    string? RefreshToken { get; }
    DateTimeOffset? AccessTokenExpiresAt { get; }
    DateTimeOffset? SessionExpiresAt { get; }
    bool RememberMe { get; }
}

public class ErpSessionAccessor : IErpSessionAccessor
{
    private readonly IHttpContextAccessor _http;

    public ErpSessionAccessor(IHttpContextAccessor http)
    {
        _http = http;
    }

    private ClaimsPrincipal? User => _http.HttpContext?.User;

    private AuthenticationProperties? Properties
    {
        get
        {
            var http = _http.HttpContext;
            if (http is null) return null;
            if (http.Items["ErpAuthProperties"] is AuthenticationProperties cached)
                return cached;

            var result = http.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme)
                .GetAwaiter().GetResult();
            if (result.Properties is not null)
                http.Items["ErpAuthProperties"] = result.Properties;

            return result.Properties;
        }
    }

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public ErpUser Current
    {
        get
        {
            var user = User;
            if (user?.Identity?.IsAuthenticated != true)
                return new ErpUser();

            return new ErpUser
            {
                UsuaId = user.FindFirstValue(ErpClaimTypes.UsuaId) ?? string.Empty,
                TrabId = user.FindFirstValue(ErpClaimTypes.TrabId) ?? string.Empty,
                EmpresaId = user.FindFirstValue(ErpClaimTypes.EmpresaId) ?? string.Empty,
                DisplayName = user.Identity?.Name ?? string.Empty,
                FirstName = user.FindFirstValue(ErpClaimTypes.FirstName) ?? string.Empty,
                Email = user.FindFirstValue(ClaimTypes.Email),
                PhotoUrl = user.FindFirstValue(ErpClaimTypes.PhotoUrl),
                RememberMe = RememberMe
            };
        }
    }

    public string? AccessToken => Item(ErpClaimTypes.AccessToken);
    public string? RefreshToken => Item(ErpClaimTypes.RefreshToken);
    public DateTimeOffset? AccessTokenExpiresAt => Parse(Item(ErpClaimTypes.AccessTokenExpires));
    public DateTimeOffset? SessionExpiresAt => Parse(Item(ErpClaimTypes.SessionExpires));
    public bool RememberMe => string.Equals(Item(ErpClaimTypes.RememberMe), "true", StringComparison.OrdinalIgnoreCase);

    private string? Item(string key) =>
        Properties?.Items.TryGetValue(key, out var value) == true ? value : null;

    private static DateTimeOffset? Parse(string? value) =>
        DateTimeOffset.TryParse(value, out var parsed) ? parsed : null;
}

public interface IErpSignInService
{
    Task SignInAsync(HttpContext http, AuthLoginResponse login, string empresaId, bool rememberMe);
    Task UpdateTokensAsync(HttpContext http, string accessToken, DateTime accessTokenExpiresAt, string? refreshToken);
    Task SignOutAsync(HttpContext http);
}

public class ErpSignInService : IErpSignInService
{
    private readonly IAuthClient _auth;

    public ErpSignInService(IAuthClient auth)
    {
        _auth = auth;
    }

    public async Task SignInAsync(HttpContext http, AuthLoginResponse login, string empresaId, bool rememberMe)
    {
        var user = login.User;
        var displayName = $"{user.ApellidoPaterno} {user.ApellidoMaterno} {user.Nombres}".Trim();
        if (string.IsNullOrWhiteSpace(displayName))
            displayName = user.DisplayName;

        var firstName = user.Nombres?.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty;
        var trabId = user.EmployeeCode ?? string.Empty;
        var photoUrl = string.IsNullOrWhiteSpace(trabId) ? null : $"/foto/{trabId}";

        var claims = new List<Claim>
        {
            new(ErpClaimTypes.UsuaId, user.UsuaId ?? user.UserId),
            new(ClaimTypes.Name, displayName),
            new(ErpClaimTypes.TrabId, trabId),
            new(ErpClaimTypes.EmpresaId, user.EmpresaId ?? empresaId),
            new(ErpClaimTypes.FirstName, firstName)
        };

        if (!string.IsNullOrWhiteSpace(user.Email))
            claims.Add(new Claim(ClaimTypes.Email, user.Email));
        if (!string.IsNullOrWhiteSpace(photoUrl))
            claims.Add(new Claim(ErpClaimTypes.PhotoUrl, photoUrl));

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var expires = rememberMe ? DateTimeOffset.UtcNow.AddDays(7) : DateTimeOffset.UtcNow.AddHours(8);
        var properties = new AuthenticationProperties
        {
            IsPersistent = true,
            AllowRefresh = false,
            ExpiresUtc = rememberMe ? DateTimeOffset.UtcNow.AddDays(7) : expires
        };

        properties.Items[ErpClaimTypes.AccessToken] = login.AccessToken;
        properties.Items[ErpClaimTypes.RefreshToken] = login.RefreshToken ?? string.Empty;
        properties.Items[ErpClaimTypes.AccessTokenExpires] = login.AccessTokenExpiresAt.ToUniversalTime().ToString("O");
        properties.Items[ErpClaimTypes.RememberMe] = rememberMe ? "true" : "false";
        if (!rememberMe)
            properties.Items[ErpClaimTypes.SessionExpires] = expires.ToString("O");

        await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity), properties);
    }

    public async Task UpdateTokensAsync(HttpContext http, string accessToken, DateTime accessTokenExpiresAt, string? refreshToken)
    {
        var result = await http.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        if (result.Principal is null || result.Properties is null)
            return;

        result.Properties.Items[ErpClaimTypes.AccessToken] = accessToken;
        result.Properties.Items[ErpClaimTypes.AccessTokenExpires] = accessTokenExpiresAt.ToUniversalTime().ToString("O");
        if (!string.IsNullOrWhiteSpace(refreshToken))
            result.Properties.Items[ErpClaimTypes.RefreshToken] = refreshToken;

        await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, result.Principal, result.Properties);
        http.Items["ErpAuthProperties"] = result.Properties;
    }

    public async Task SignOutAsync(HttpContext http)
    {
        var result = await http.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        var refresh = result.Properties?.Items.TryGetValue(ErpClaimTypes.RefreshToken, out var token) == true ? token : null;
        _ = _auth.LogoutAsync(refresh);
        await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    }
}
