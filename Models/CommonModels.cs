namespace ErpAndahuasi.Models;

public class BaseResponse
{
    public bool Success { get; set; }
    public bool Exception { get; set; }
    public string? TipoException { get; set; }
    public string? Message { get; set; }
    public List<string> Errores { get; set; } = [];
    public int StatusCode { get; set; }
}

public interface IBaseResponse
{
    BaseResponse BaseResponse { get; set; }
}

public class TenantInfo
{
    public string EmpresaId { get; set; } = "02";
    public string Nombre { get; set; } = "Andahuasi";
    public string PrimaryColor { get; set; } = "#0067C0";
    public string LogoBlanco { get; set; } = "/img/branding/logo_andahuasi.png";

    public string PrimaryRgb
    {
        get
        {
            var hex = (PrimaryColor ?? "#0067C0").TrimStart('#');
            if (hex.Length != 6)
                hex = "0067C0";
            return $"{Convert.ToInt32(hex[..2], 16)}, {Convert.ToInt32(hex[2..4], 16)}, {Convert.ToInt32(hex[4..6], 16)}";
        }
    }
}

public static class Tenants
{
    public static readonly IReadOnlyDictionary<string, TenantInfo> Catalog = new Dictionary<string, TenantInfo>(StringComparer.OrdinalIgnoreCase)
    {
        ["02"] = new() { EmpresaId = "02", Nombre = "Andahuasi", PrimaryColor = "#0067C0" },
        ["05"] = new() { EmpresaId = "05", Nombre = "San Nicolás", PrimaryColor = "#7A3A9A" },
        ["06"] = new() { EmpresaId = "06", Nombre = "Andahuasi KM 41.5", PrimaryColor = "#13A842" }
    };

    public static TenantInfo Resolve(string? empresaId) =>
        Catalog.TryGetValue(empresaId ?? "02", out var tenant) ? tenant : Catalog["02"];
}
