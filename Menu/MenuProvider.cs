using ErpAndahuasi.Api;
using ErpAndahuasi.Auth;
using ErpAndahuasi.Models;

namespace ErpAndahuasi.Menu;

public interface IMenuProvider
{
    Task<IReadOnlyList<ModuloMenuData>> GetModulosAsync();
    Task<bool> CanAccessAsync(string accUrl);
}

public class MenuProvider : IMenuProvider
{
    private const string CacheKey = "ErpMenu";
    private static readonly HashSet<string> AlwaysAllowed = new(StringComparer.OrdinalIgnoreCase)
    {
        "/rrhh/perfil"
    };

    private readonly SistemaApi _sistema;
    private readonly IHttpContextAccessor _http;
    private readonly IErpSessionAccessor _session;

    public MenuProvider(SistemaApi sistema, IHttpContextAccessor http, IErpSessionAccessor session)
    {
        _sistema = sistema;
        _http = http;
        _session = session;
    }

    public async Task<IReadOnlyList<ModuloMenuData>> GetModulosAsync()
    {
        var context = _http.HttpContext;
        if (context is null || !_session.IsAuthenticated)
            return [];

        if (context.Items[CacheKey] is List<ModuloMenuData> cached)
            return cached;

        try
        {
            var response = await _sistema.GetMenuUsuarioAsync();
            var modulos = response.BaseResponse.Success ? response.Modulos : [];
            foreach (var modulo in modulos)
            {
                foreach (var categoria in modulo.Categorias)
                {
                    foreach (var acceso in categoria.Accesos)
                        acceso.AccURL = MenuUrl.Normalize(acceso.AccURL);
                }
            }

            context.Items[CacheKey] = modulos;
            return modulos;
        }
        catch
        {
            return [];
        }
    }

    public async Task<bool> CanAccessAsync(string accUrl)
    {
        var target = MenuUrl.Normalize(accUrl);
        if (string.IsNullOrWhiteSpace(target) || target == "/" || AlwaysAllowed.Contains(target))
            return true;

        var modulos = await GetModulosAsync();
        foreach (var modulo in modulos)
        {
            foreach (var categoria in modulo.Categorias)
            {
                foreach (var acceso in categoria.Accesos)
                {
                    var url = MenuUrl.Normalize(acceso.AccURL);
                    if (string.IsNullOrWhiteSpace(url) || url == "#")
                        continue;

                    if (string.Equals(url, target, StringComparison.OrdinalIgnoreCase)
                        || target.StartsWith(url + "/", StringComparison.OrdinalIgnoreCase))
                        return true;
                }
            }
        }

        return false;
    }
}

public static class MenuUrl
{
    private static readonly Dictionary<string, string> Legacy = new(StringComparer.OrdinalIgnoreCase)
    {
        ["__Administracion/MntUsuario/Usuario"] = "/administracion/usuarios",
        ["__Administracion/MntRol/Rol/Rol"] = "/administracion/roles",
        ["__Administracion/MntModulo/Modulo"] = "/administracion/modulos",
        ["__Administracion/MntCategoria/Categoria"] = "/administracion/categorias",
        ["__Administracion/Accesos/Acceso"] = "/administracion/accesos",
        ["__RecursosHumanos/Perfil/Perfil"] = "/rrhh/perfil"
    };

    private static readonly Dictionary<string, string> TypeIcons = new()
    {
        ["F"] = "ri-file-list-3-line",
        ["R"] = "ri-bar-chart-box-line",
        ["P"] = "ri-play-circle-line",
        ["C"] = "ri-settings-3-line",
        ["X"] = "ri-logout-box-r-line"
    };

    public static string Icon(AccesoMenuData acceso)
    {
        if (!string.IsNullOrWhiteSpace(acceso.AccIcono))
            return acceso.AccIcono.Trim();

        var tipo = acceso.AccTipo?.Trim().ToUpperInvariant() ?? "F";
        return TypeIcons.TryGetValue(tipo, out var icon) ? icon : "ri-circle-line";
    }

    public static string Normalize(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return "#";

        url = url.Trim();
        if (url.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            return url;

        if (Legacy.TryGetValue(url, out var mapped))
            return mapped;

        // Conversión genérica de rutas legacy ASP.NET WebForms/Razor antiguo.
        if (url.StartsWith("__"))
        {
            url = "/" + url.TrimStart('_');
            url = System.Text.RegularExpressions.Regex.Replace(url, @"/Mnt[A-Za-z]+", string.Empty);
            url = System.Text.RegularExpressions.Regex.Replace(
                url,
                @"/([A-Z][a-z]+)$",
                m => "/" + m.Groups[1].Value.ToLowerInvariant() + "s");
        }

        if (!url.StartsWith('/'))
            url = "/" + url;

        if (url.StartsWith("/es/", StringComparison.OrdinalIgnoreCase))
            url = url[3..];

        return url.ToLowerInvariant();
    }
}
