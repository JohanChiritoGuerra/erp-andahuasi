namespace ErpAndahuasi.Models;

public class TrabajadorModel
{
    public string TrabId { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string TrabDNI { get; set; } = string.Empty;
    public string TrabDireccion { get; set; } = string.Empty;
    public string TrabCorreoElec { get; set; } = string.Empty;
    public string TrabTelef { get; set; } = string.Empty;
    public string Cargo { get; set; } = string.Empty;
    public DateTime? ContLabFecInicio { get; set; }
    public DateTime? ContLabFecFin { get; set; }
}

public class PerfilTrabajadorResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public TrabajadorModel? PerfilTrabajador { get; set; }
}

public class ActualizarPerfilRequest
{
    public string TrabId { get; set; } = string.Empty;
    public string EmpresaId { get; set; } = string.Empty;
    public string? TrabCorreoElec { get; set; }
    public string? TrabTelef { get; set; }
    public string? TrabDireccion { get; set; }
}
