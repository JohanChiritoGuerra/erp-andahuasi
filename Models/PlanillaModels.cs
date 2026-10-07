namespace ErpAndahuasi.Models;

public class CalculoPlanillaPreviewRequest
{
    public string EmpresaId { get; set; } = string.Empty;
    public string? EmpresaCalculoId { get; set; }
    public string Anio { get; set; } = string.Empty;
    public string Mes { get; set; } = string.Empty;
    public string Forma { get; set; } = "Todos";
    public string? SeccionId { get; set; }
    public string? TrabId { get; set; }
}

public class CalculoPlanillaEjecutarRequest
{
    public string EmpresaId { get; set; } = string.Empty;
    public string? EmpresaCalculoId { get; set; }
    public string UsrSistema { get; set; } = string.Empty;
    public string Anio { get; set; } = string.Empty;
    public string Mes { get; set; } = string.Empty;
    public string Forma { get; set; } = "Todos";
    public string? SeccionId { get; set; }
    public string? TrabId { get; set; }
    public List<string> TrabIds { get; set; } = [];
    public bool EsProcesoFinal { get; set; }
}

public class TrabajadorPlanillaDto
{
    public string TrabId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string SeccionId { get; set; } = string.Empty;
    public string SeccionNombre { get; set; } = string.Empty;
    public string Observacion { get; set; } = string.Empty;
    public bool Bloqueado { get; set; }
    public bool ProcesadoExitoso { get; set; }
}

public class SeccionPlanillaDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
}

public class ExcesoPlanillaDto
{
    public string TrabId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string ConPllaId { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal Monto { get; set; }
}

public class CalculoPlanillaPreviewResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<TrabajadorPlanillaDto> Trabajadores { get; set; } = [];
    public List<SeccionPlanillaDto> Secciones { get; set; } = [];
    public bool MotorDisponible { get; set; }
}

public class CalculoPlanillaEjecutarResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public bool Exito { get; set; }
    public int Boletas { get; set; }
    public int Detalles { get; set; }
    public List<string> Log { get; set; } = [];
    public List<ExcesoPlanillaDto> Excesos { get; set; } = [];
}

public class BloquearPlanillaRequest
{
    public string EmpresaId { get; set; } = string.Empty;
    public string? EmpresaCalculoId { get; set; }
    public string Anio { get; set; } = string.Empty;
    public string Mes { get; set; } = string.Empty;
    public List<string> TrabIds { get; set; } = [];
}

public class BloquearPlanillaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public int Bloqueadas { get; set; }
}

public class BoletaDatoDto
{
    public string Etiqueta { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
}

public class BoletaConceptoDto
{
    public string Ganancia { get; set; } = string.Empty;
    public string MontoGanancia { get; set; } = string.Empty;
    public string Descuento { get; set; } = string.Empty;
    public string MontoDescuento { get; set; } = string.Empty;
}

public class BoletaPagoDto
{
    public string NombreEmpresa { get; set; } = string.Empty;
    public string DireccionEmpresa { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Trabajador { get; set; } = string.Empty;
    public string Seccion { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Ocupacion { get; set; } = string.Empty;
    public string FechaIngreso { get; set; } = string.Empty;
    public string FechaCese { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string EsSalud { get; set; } = string.Empty;
    public string Cuspp { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Regimen { get; set; } = string.Empty;
    public string Basico { get; set; } = string.Empty;
    public string Neto { get; set; } = string.Empty;
    public string AporteEmpleador { get; set; } = string.Empty;
    public List<BoletaDatoDto> Horas { get; set; } = [];
    public List<BoletaConceptoDto> Conceptos { get; set; } = [];
}

public class BoletaPagoResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public BoletaPagoDto? Boleta { get; set; }
}

public class TrazaCalculoDto
{
    public string Fuente { get; set; } = string.Empty;
    public string Dato { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Cuando { get; set; } = string.Empty;
}

public class PasoCalculoDto
{
    public int Orden { get; set; }
    public string Grupo { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Formula { get; set; } = string.Empty;
    public decimal? Monto { get; set; }
    public List<TrazaCalculoDto> Origenes { get; set; } = [];
}

public class ExplicacionPlanillaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public string TrabId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string SeccionId { get; set; } = string.Empty;
    public List<PasoCalculoDto> Pasos { get; set; } = [];
}
