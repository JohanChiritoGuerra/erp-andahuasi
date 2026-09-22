using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ErpAndahuasi.Auth;
using ErpAndahuasi.Models;

namespace ErpAndahuasi.Api;

public class ErpApiException : Exception
{
    public int StatusCode { get; }

    public ErpApiException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }
}

public class ErpApiClient
{
    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static readonly TimeSpan RefreshMargin = TimeSpan.FromMinutes(2);

    private readonly IHttpClientFactory _factory;
    private readonly IHttpContextAccessor _http;
    private readonly IAuthClient _auth;
    private readonly IErpSignInService _signIn;
    private readonly IErpSessionAccessor _session;

    public ErpApiClient(
        IHttpClientFactory factory,
        IHttpContextAccessor http,
        IAuthClient auth,
        IErpSignInService signIn,
        IErpSessionAccessor session)
    {
        _factory = factory;
        _http = http;
        _auth = auth;
        _signIn = signIn;
        _session = session;
    }

    public Task<T> GetAsync<T>(string path, CancellationToken ct = default) =>
        SendAsync<T>(HttpMethod.Get, path, null, ct);

    public Task<T> PostAsync<T>(string path, object? body, CancellationToken ct = default) =>
        SendAsync<T>(HttpMethod.Post, path, body, ct);

    public Task<T> PutAsync<T>(string path, object? body, CancellationToken ct = default) =>
        SendAsync<T>(HttpMethod.Put, path, body, ct);

    public Task<T> PatchAsync<T>(string path, object? body, CancellationToken ct = default) =>
        SendAsync<T>(HttpMethod.Patch, path, body, ct);

    public Task<T> DeleteAsync<T>(string path, CancellationToken ct = default) =>
        SendAsync<T>(HttpMethod.Delete, path, null, ct);

    public async Task<byte[]?> GetBytesAsync(string path, CancellationToken ct = default)
    {
        using var response = await SendRawAsync(HttpMethod.Get, path, null, null, ct);
        if (!response.IsSuccessStatusCode)
            return null;

        return await response.Content.ReadAsByteArrayAsync(ct);
    }

    public async Task<T> SendMultipartAsync<T>(HttpMethod method, string path, MultipartFormDataContent content, CancellationToken ct = default)
    {
        using var response = await SendRawAsync(method, path, null, content, ct);
        var raw = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new ErpApiException((int)response.StatusCode, raw);

        return JsonSerializer.Deserialize<T>(raw, JsonOptions) ?? throw new ErpApiException(500, "Respuesta inválida de la API.");
    }

    private async Task<T> SendAsync<T>(HttpMethod method, string path, object? body, CancellationToken ct)
    {
        using var response = await SendRawAsync(method, path, body, null, ct);
        var raw = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(raw))
        {
            if (!response.IsSuccessStatusCode)
                throw new ErpApiException((int)response.StatusCode, $"Error {(int)response.StatusCode}");

            return default!;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(raw, JsonOptions) ?? throw new ErpApiException(500, "Respuesta inválida de la API.");
        }
        catch (JsonException) when (!response.IsSuccessStatusCode)
        {
            throw new ErpApiException((int)response.StatusCode, raw);
        }
    }

    private async Task<HttpResponseMessage> SendRawAsync(HttpMethod method, string path, object? body, HttpContent? content, CancellationToken ct)
    {
        var token = await EnsureAccessTokenAsync(ct);
        var response = await DispatchAsync(method, path, body, content, token, ct);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            response.Dispose();
            token = await EnsureAccessTokenAsync(ct, force: true);
            response = await DispatchAsync(method, path, body, content, token, ct);
        }

        return response;
    }

    private async Task<HttpResponseMessage> DispatchAsync(HttpMethod method, string path, object? body, HttpContent? content, string token, CancellationToken ct)
    {
        var client = _factory.CreateClient("ErpApi");
        using var request = new HttpRequestMessage(method, path.TrimStart('/'));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        if (content is not null)
            request.Content = content;
        else if (body is not null)
            request.Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json");

        return await client.SendAsync(request, ct);
    }

    private async Task<string> EnsureAccessTokenAsync(CancellationToken ct, bool force = false)
    {
        var http = _http.HttpContext ?? throw new InvalidOperationException("No hay HttpContext.");
        var token = _session.AccessToken;
        var expires = _session.AccessTokenExpiresAt;
        var needsRefresh = force
            || string.IsNullOrWhiteSpace(token)
            || expires is null
            || expires.Value <= DateTimeOffset.UtcNow.Add(RefreshMargin);

        if (!needsRefresh)
            return token!;

        var refresh = _session.RefreshToken;
        if (string.IsNullOrWhiteSpace(refresh))
            throw new ErpApiException(401, "SESSION_EXPIRED");

        var renewed = await _auth.RefreshAsync(refresh, ct);
        if (renewed is null || string.IsNullOrWhiteSpace(renewed.AccessToken))
            throw new ErpApiException(401, "SESSION_EXPIRED");

        await _signIn.UpdateTokensAsync(http, renewed.AccessToken, renewed.AccessTokenExpiresAt, renewed.RefreshToken);
        return renewed.AccessToken;
    }
}
