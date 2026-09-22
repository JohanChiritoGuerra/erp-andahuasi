using ErpAndahuasi.Options;
using Microsoft.Extensions.Options;

namespace ErpAndahuasi.Auth;

public interface ITenantResolver
{
    string? ResolveEmpresaId(HttpContext http);
    TenantHost Current(HttpContext http);
}

public record TenantHost(string EmpresaId, string Host);

public class TenantResolver : ITenantResolver
{
    private readonly TenantOptions _options;

    public TenantResolver(IOptions<TenantOptions> options)
    {
        _options = options.Value;
    }

    public string? ResolveEmpresaId(HttpContext http)
    {
        var host = http.Request.Host.Host.Trim().ToLowerInvariant();
        if (_options.ByHost.TryGetValue(host, out var empresaId))
            return empresaId;

        if (http.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment()
            && (host is "localhost" or "127.0.0.1"))
            return _options.DefaultEmpresaId;

        return null;
    }

    public TenantHost Current(HttpContext http)
    {
        var host = http.Request.Host.Host;
        var empresaId = ResolveEmpresaId(http) ?? _options.DefaultEmpresaId;
        return new TenantHost(empresaId, host);
    }
}
