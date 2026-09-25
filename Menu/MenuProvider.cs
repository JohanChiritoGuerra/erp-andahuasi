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

    private static readonly Dictionary<string, string> UrlIcons = new(StringComparer.OrdinalIgnoreCase)
    {
        ["/administracion/usuarios"] = "ri-user-settings-line",
        ["/administracion/roles"] = "ri-shield-user-line",
        ["/administracion/modulos"] = "ri-apps-2-line",
        ["/administracion/categorias"] = "ri-folder-open-line",
        ["/administracion/accesos"] = "ri-key-2-line",
        ["/rrhh/perfil"] = "ri-user-3-line",
        ["/paltos"] = "ri-tree-line",
        ["/paltos/campos-campanias"] = "ri-landscape-line",
        ["/paltos/fertilizacion"] = "ri-flask-line",
        ["/paltos/fertilizacion/presupuesto"] = "ri-file-chart-line",
        ["/paltos/fertilizacion/programas"] = "ri-file-chart-line",
        ["/paltos/fertilizacion/control"] = "ri-line-chart-line",
        ["/paltos/fertilizacion/configuracion-items"] = "ri-settings-3-line"
    };

    private static readonly Dictionary<string, string> TablerToRemix = new(StringComparer.OrdinalIgnoreCase)
    {
        ["tabler-users"] = "ri-group-line",
        ["tabler-user"] = "ri-user-3-line",
        ["tabler-settings"] = "ri-settings-3-line",
        ["tabler-lock"] = "ri-lock-2-line",
        ["tabler-key"] = "ri-key-2-line",
        ["tabler-folder"] = "ri-folder-line",
        ["tabler-layout"] = "ri-layout-grid-line",
        ["tabler-apps"] = "ri-apps-2-line",
        ["tabler-tree"] = "ri-tree-line",
        ["tabler-plant"] = "ri-plant-line",
        ["tabler-dashboard"] = "ri-dashboard-line",
        ["tabler-tool"] = "ri-tools-line",
        ["tabler-building"] = "ri-building-2-line"
    };

    /// <summary>Clase CSS completa para Iconify Remix (`ri ri-xxx`).</summary>
    public static string CssIcon(string? icon, string fallback = "ri-circle-line")
    {
        var name = ResolveIconName(icon) ?? fallback;
        return name.StartsWith("ri ", StringComparison.Ordinal) ? name : $"ri {name}";
    }

    public static string Icon(AccesoMenuData acceso)
    {
        if (!string.IsNullOrWhiteSpace(acceso.AccIcono))
            return CssIcon(acceso.AccIcono);

        var url = Normalize(acceso.AccURL);
        if (UrlIcons.TryGetValue(url, out var byUrl))
            return CssIcon(byUrl);

        var tipo = acceso.AccTipo?.Trim().ToUpperInvariant() ?? "F";
        if (tipo.Length > 1)
            tipo = tipo[..1];
        return CssIcon(TypeIcons.TryGetValue(tipo, out var icon) ? icon : "ri-circle-line");
    }

    public static string ModuleIcon(string? icon, string? nombre = null) =>
        CssIcon(icon, nombre?.Contains("palt", StringComparison.OrdinalIgnoreCase) == true ? "ri-tree-line"
            : nombre?.Contains("admin", StringComparison.OrdinalIgnoreCase) == true ? "ri-settings-3-line"
            : nombre?.Contains("manten", StringComparison.OrdinalIgnoreCase) == true ? "ri-tools-line"
            : "ri-box-3-line");

    public static string CategoryIcon(string? icon, string? nombre = null, string? firstUrl = null)
    {
        if (!string.IsNullOrWhiteSpace(icon))
            return CssIcon(icon);

        var url = Normalize(firstUrl);
        if (UrlIcons.TryGetValue(url, out var byUrl))
            return CssIcon(byUrl);

        return CssIcon(
            nombre?.Contains("fertiliz", StringComparison.OrdinalIgnoreCase) == true ? "ri-flask-line"
            : nombre?.Contains("campo", StringComparison.OrdinalIgnoreCase) == true ? "ri-landscape-line"
            : "ri-folder-line");
    }

    private static string? ResolveIconName(string? icon)
    {
        if (string.IsNullOrWhiteSpace(icon))
            return null;

        icon = icon.Trim();
        if (icon.StartsWith("ri ", StringComparison.OrdinalIgnoreCase))
        {
            var parts = icon.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            icon = parts.LastOrDefault(p => p.StartsWith("ri-", StringComparison.OrdinalIgnoreCase)) ?? icon;
        }

        if (TablerToRemix.TryGetValue(icon, out var mapped))
            return mapped;

        if (icon.StartsWith("tabler-", StringComparison.OrdinalIgnoreCase))
            return "ri-circle-line";

        if (icon.StartsWith("ri-", StringComparison.OrdinalIgnoreCase))
            return icon;

        return icon.Contains('-', StringComparison.Ordinal) ? icon : $"ri-{icon}";
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
