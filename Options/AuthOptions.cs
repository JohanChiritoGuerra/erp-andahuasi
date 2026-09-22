namespace ErpAndahuasi.Options;

public class AuthOptions
{
    public const string SectionName = "Auth";

    public string BaseUrl { get; set; } = "https://auth.andahuasi.com";
    public string BffClientSecret { get; set; } = string.Empty;
}

public class ErpApiOptions
{
    public const string SectionName = "ErpApi";

    public string BaseUrl { get; set; } = "https://api.andahuasi.com";
}

public class TenantOptions
{
    public const string SectionName = "Tenants";

    public string DefaultEmpresaId { get; set; } = "02";
    public Dictionary<string, string> ByHost { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public class FotosOptions
{
    public const string SectionName = "FotosTrabajadores";

    public string Path { get; set; } = string.Empty;
}
