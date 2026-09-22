using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ErpAndahuasi.Models;
using ErpAndahuasi.Options;
using Microsoft.Extensions.Options;

namespace ErpAndahuasi.Auth;

public interface IAuthClient
{
    Task<(AuthLoginResponse? Data, string? Error)> LoginWebAsync(string username, string password, string empresaId, CancellationToken ct = default);
    Task<AuthRefreshResponse?> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string? refreshToken, CancellationToken ct = default);
    Task<byte[]?> GetFotoAsync(string accessToken, CancellationToken ct = default);
}

public class AuthClient : IAuthClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly HttpClient _http;
    private readonly AuthOptions _options;

    public AuthClient(IHttpClientFactory factory, IOptions<AuthOptions> options)
    {
        _http = factory.CreateClient("Auth");
        _options = options.Value;
    }

    public async Task<(AuthLoginResponse? Data, string? Error)> LoginWebAsync(string username, string password, string empresaId, CancellationToken ct = default)
    {
        using var request = CreateJson(HttpMethod.Post, "api/v1/auth/login-web", new
        {
            Username = username,
            Password = password,
            EmpresaId = empresaId
        });

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct);
        }
        catch (Exception)
        {
            return (null, "No se pudo conectar con el servidor de autenticación.");
        }

        var raw = await response.Content.ReadAsStringAsync(ct);

        if (response.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.NotFound)
            return (null, ReadProblem(raw) ?? "Usuario o contraseña incorrectos.");

        if ((int)response.StatusCode >= 500)
            return (null, "Error interno del servidor de autenticación. Intente nuevamente.");

        if (!response.IsSuccessStatusCode)
            return (null, ReadProblem(raw) ?? "Error al iniciar sesión.");

        var data = JsonSerializer.Deserialize<AuthLoginResponse>(raw, JsonOptions);
        if (data is null)
            return (null, "Respuesta inválida del servidor de autenticación.");

        return (data, null);
    }

    public async Task<AuthRefreshResponse?> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        using var request = CreateJson(HttpMethod.Post, "api/v1/auth/refresh", new { refreshToken });
        try
        {
            using var response = await _http.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
                return null;

            var raw = await response.Content.ReadAsStringAsync(ct);
            return JsonSerializer.Deserialize<AuthRefreshResponse>(raw, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return;

        try
        {
            using var request = CreateJson(HttpMethod.Post, "api/v1/auth/logout", new { refreshToken });
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(5));
            await _http.SendAsync(request, cts.Token);
        }
        catch
        {
            // El cierre local no debe depender de Auth.
        }
    }

    public async Task<byte[]?> GetFotoAsync(string accessToken, CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "api/v1/auth/foto");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        ApplySecret(request);

        using var response = await _http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            return null;

        return await response.Content.ReadAsByteArrayAsync(ct);
    }

    private HttpRequestMessage CreateJson(HttpMethod method, string path, object body)
    {
        var request = new HttpRequestMessage(method, path)
        {
            Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json")
        };
        ApplySecret(request);
        return request;
    }

    private void ApplySecret(HttpRequestMessage request)
    {
        if (!string.IsNullOrWhiteSpace(_options.BffClientSecret))
            request.Headers.TryAddWithoutValidation("X-Andahuasi-Bff-Secret", _options.BffClientSecret);
    }

    private static string? ReadProblem(string raw)
    {
        try
        {
            var problem = JsonSerializer.Deserialize<AuthProblem>(raw, JsonOptions);
            return problem?.Detail ?? problem?.Title;
        }
        catch
        {
            return null;
        }
    }
}
