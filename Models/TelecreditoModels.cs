namespace ErpAndahuasi.Models;

public class TelecreditoRequest
{
    public string EmpresaId { get; set; } = string.Empty;
    public string EmpresaOperacionId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class TelecreditoListarRequest : TelecreditoRequest
{
    public string? Anio { get; set; }
    public string? Mes { get; set; }
}

public class TelecreditoCrearRequest : TelecreditoRequest
{
    public string TipoOperacion { get; set; } = string.Empty;
    public DateTime FechaDesde { get; set; }
    public DateTime FechaHasta { get; set; }
    public string? Observacion { get; set; }
}

public class TelecreditoOperacionRequest : TelecreditoRequest
{
    public int OperacionId { get; set; }
    /// <summary>Fecha de proceso del Excel (C7). Si falta, la API usa el día de generación.</summary>
    public DateTime? FechaProceso { get; set; }
}

public class TelecreditoTrabajadoresRequest : TelecreditoOperacionRequest
{
    public List<string> TrabIds { get; set; } = [];
}

public class TelecreditoEmpresaDto
{
    public string EmpresaId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
}

public class TelecreditoOperacionDto
{
    public int OperacionId { get; set; }
    public string Anio { get; set; } = string.Empty;
    public string Mes { get; set; } = string.Empty;
    public int Correlativo { get; set; }
    public string TipoOperacion { get; set; } = string.Empty;
    public DateTime FechaDesde { get; set; }
    public DateTime FechaHasta { get; set; }
    public DateTime FechaRegistro { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Observacion { get; set; } = string.Empty;
    public int Trabajadores { get; set; }
    public string UsrCrea { get; set; } = string.Empty;
    public DateTime FecCrea { get; set; }
    public string? UsrCierre { get; set; }
    public DateTime? FecCierre { get; set; }
    public string? UsrArchivo { get; set; }
    public DateTime? FecArchivo { get; set; }
}

public class TelecreditoDetalleDto
{
    public string TrabId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public DateTime? FechaCese { get; set; }
    public string? Cuenta { get; set; }
    public decimal? MontoMensualidad { get; set; }
    public decimal? MontoLiquidacion { get; set; }
}

public class TelecreditoCandidatoDto
{
    public string TrabId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string SeccionNombre { get; set; } = string.Empty;
    public DateTime? FechaCese { get; set; }
    public bool Sugerido { get; set; }
    public bool EnOperacion { get; set; }
    public string? Ocupado { get; set; }
}

public class TelecreditoArchivoDto
{
    public string Nombre { get; set; } = string.Empty;
    public string ContenidoBase64 { get; set; } = string.Empty;
}

public class TelecreditoListarResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public TelecreditoEmpresaDto? Empresa { get; set; }
    public List<TelecreditoOperacionDto> Operaciones { get; set; } = [];
}

public class TelecreditoTotalesDto
{
    public int CantidadMensualidad { get; set; }
    public decimal TotalMensualidad { get; set; }
    public int CantidadLiquidacion { get; set; }
    public decimal TotalLiquidacion { get; set; }
    public decimal Total { get; set; }
}

public class TelecreditoOperacionResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public TelecreditoOperacionDto? Operacion { get; set; }
    public List<TelecreditoDetalleDto> Detalle { get; set; } = [];
    public TelecreditoTotalesDto? Totales { get; set; }
    public List<string> Avisos { get; set; } = [];
}

public class TelecreditoCandidatosResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<TelecreditoCandidatoDto> Candidatos { get; set; } = [];
}

public class TelecreditoArchivosResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<TelecreditoArchivoDto> Archivos { get; set; } = [];
}
