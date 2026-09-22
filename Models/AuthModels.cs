namespace ErpAndahuasi.Models;

public class AuthUserDto
{
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? EmployeeCode { get; set; }
    public string Source { get; set; } = string.Empty;
    public string? EmpresaId { get; set; }
    public string? UsuaId { get; set; }
    public string? ApellidoPaterno { get; set; }
    public string? ApellidoMaterno { get; set; }
    public string? Nombres { get; set; }
    public string? Dni { get; set; }
    public string? Direccion { get; set; }
    public DateTime? ContratoFechaInicio { get; set; }
    public DateTime? ContratoFechaFin { get; set; }
    public int Estado { get; set; }
    public string? AppScope { get; set; }
}

public class AuthLoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public DateTime AccessTokenExpiresAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime RefreshTokenExpiresAt { get; set; }
    public AuthUserDto User { get; set; } = new();
}

public class AuthRefreshResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public DateTime AccessTokenExpiresAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime RefreshTokenExpiresAt { get; set; }
}

public class AuthProblem
{
    public string? Title { get; set; }
    public string? Detail { get; set; }
}

public class ErpUser
{
    public string UsuaId { get; set; } = string.Empty;
    public string TrabId { get; set; } = string.Empty;
    public string EmpresaId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhotoUrl { get; set; }
    public bool RememberMe { get; set; }
}
