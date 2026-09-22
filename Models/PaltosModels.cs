namespace ErpAndahuasi.Models;

public class ItemFertilizacionListaDto
{
    public string GrpAlmId { get; set; } = string.Empty;
    public string ClsAlmId { get; set; } = string.Empty;
    public string IteAlmId { get; set; } = string.Empty;
    public string CodigoItem { get; set; } = string.Empty;
    public string NombreItem { get; set; } = string.Empty;
    public string UnidadSalida { get; set; } = string.Empty;
    public bool TieneConfiguracion { get; set; }
    public string? Clasificacion { get; set; }
    public string? DestinoReporte { get; set; }
    public string? EstadoValidacion { get; set; }
    public string? FormaFisica { get; set; }
    public bool Activo { get; set; }
    public DateTime? VigenciaDesde { get; set; }
    public string EstadoReporte { get; set; } = "PENDIENTE";
    public string? AportesPorUnidad { get; set; }
}

public class ItemFertilizacionElementoDto
{
    public long ItemAlmacenElementoId { get; set; }
    public string ElementoCodigo { get; set; } = string.Empty;
    public string ElementoNombre { get; set; } = string.Empty;
    public string FormaDeclarada { get; set; } = string.Empty;
    public decimal ValorDeclarado { get; set; }
    public string TipoConcentracion { get; set; } = string.Empty;
    public decimal FactorConversionElemento { get; set; }
}

public class ItemFertilizacionDocumentoDto
{
    public long ItemAlmacenFertilizacionDocumentoId { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreOriginal { get; set; } = string.Empty;
    public string TipoMime { get; set; } = string.Empty;
    public DateTime FechaSistema { get; set; }
}

public class ItemFertilizacionConfiguracionDto : ItemFertilizacionListaDto
{
    public decimal? FactorKgPorUnidad { get; set; }
    public decimal? FactorLitrosPorUnidad { get; set; }
    public decimal? DensidadKgPorLitro { get; set; }
    public string? FuenteComposicion { get; set; }
    public DateTime? VigenciaHasta { get; set; }
    public List<ItemFertilizacionElementoDto> Elementos { get; set; } = [];
    public List<ItemFertilizacionDocumentoDto> Documentos { get; set; } = [];
}

public class ElementoQuimicoDto
{
    public int ElementoQuimicoId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

public class GuardarItemFertilizacionElementoRequest
{
    public string ElementoCodigo { get; set; } = string.Empty;
    public string FormaDeclarada { get; set; } = string.Empty;
    public decimal ValorDeclarado { get; set; }
    public string TipoConcentracion { get; set; } = string.Empty;
}

public class GuardarItemFertilizacionRequest
{
    public string GrpAlmId { get; set; } = string.Empty;
    public string ClsAlmId { get; set; } = string.Empty;
    public string IteAlmId { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public string Clasificacion { get; set; } = "NUTRICIONAL";
    public string DestinoReporte { get; set; } = "NUTRIENTES";
    public string EstadoValidacion { get; set; } = "BORRADOR";
    public string FormaFisica { get; set; } = "SOLIDO";
    public decimal? FactorKgPorUnidad { get; set; }
    public decimal? FactorLitrosPorUnidad { get; set; }
    public decimal? DensidadKgPorLitro { get; set; }
    public string? FuenteComposicion { get; set; }
    public DateTime VigenciaDesde { get; set; }
    public DateTime? VigenciaHasta { get; set; }
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
    public List<GuardarItemFertilizacionElementoRequest> Elementos { get; set; } = [];
}

public class ItemFertilizacionListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<ItemFertilizacionListaDto> Items { get; set; } = [];
}

public class ItemFertilizacionResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public ItemFertilizacionConfiguracionDto? Item { get; set; }
}

public class ElementoQuimicoListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<ElementoQuimicoDto> Elementos { get; set; } = [];
}

public class DocumentoFertilizacionResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public ItemFertilizacionDocumentoDto? Documento { get; set; }
}

public class CampoMaestroDto
{
    public string CodigoCampo { get; set; } = string.Empty;
    public string NombreCampo { get; set; } = string.Empty;
    public decimal AreaHa { get; set; }
    public bool YaAdministrado { get; set; }
}

public class CampaniaCampoDto
{
    public long CampoCampaniaId { get; set; }
    public long CampoPaltoId { get; set; }
    public string CodigoCampo { get; set; } = string.Empty;
    public string NombreCampo { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string Estado { get; set; } = string.Empty;
    public decimal AreaHa { get; set; }
    public string? Variedad { get; set; }
    public string? Patron { get; set; }
    public bool AreaReferencial { get; set; }
    public long? OrigenCampoCampaniaId { get; set; }
    public string? TipoPresupuesto { get; set; }
    public int? PresupuestoVersion { get; set; }
    public decimal CoberturaPorcentaje { get; set; }
    public int MesesCerrados { get; set; }
    public bool TieneDiscrepancias { get; set; }
}

public class CampoPaltoDto
{
    public long CampoPaltoId { get; set; }
    public string CodigoCampo { get; set; } = string.Empty;
    public string NombreActual { get; set; } = string.Empty;
    public decimal AreaActualHa { get; set; }
    public string? Variedad { get; set; }
    public string? Patron { get; set; }
    public DateTime? FechaPlantacion { get; set; }
    public string? Observaciones { get; set; }
    public bool Activo { get; set; }
    public CampaniaCampoDto? CampaniaActiva { get; set; }
    public CampaniaCampoDto? CampaniaPlanificacion { get; set; }
    public List<CampaniaCampoDto> Historial { get; set; } = [];
}

public class GuardarCampoPaltoRequest
{
    public long? CampoPaltoId { get; set; }
    public string CodigoCampo { get; set; } = string.Empty;
    public decimal? AreaActualHa { get; set; }
    public string? Variedad { get; set; }
    public string? Patron { get; set; }
    public DateTime? FechaPlantacion { get; set; }
    public string? Observaciones { get; set; }
    public bool Activo { get; set; } = true;
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class CrearCampaniaCampoRequest
{
    public long CampoPaltoId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal AreaHa { get; set; }
    public long? HeredarDeCampoCampaniaId { get; set; }
    public string? Observaciones { get; set; }
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class AccionCampaniaRequest
{
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
    public string? Motivo { get; set; }
}

public class ReimportarPresupuestoCampaniaRequest : AccionCampaniaRequest
{
    public long CampoCampaniaFuenteId { get; set; }
}

public class ReconstruccionCampaniaDto
{
    public string CodigoCampo { get; set; } = string.Empty;
    public string NombreCampo { get; set; } = string.Empty;
    public string Campania { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public int Salidas { get; set; }
    public int Items { get; set; }
    public int ItemsConfigurados { get; set; }
    public decimal CoberturaPorcentaje { get; set; }
    public bool YaReconstruida { get; set; }
}

public class ReconstruirHistoricoRequest
{
    public List<string> CodigosCampo { get; set; } = [];
    public long? PresupuestoReferenciaCampoCampaniaId { get; set; }
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class CamposPaltoResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<CampoPaltoDto> Campos { get; set; } = [];
}

public class CampoPaltoResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public CampoPaltoDto? Campo { get; set; }
}

public class CatalogoCamposResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<CampoMaestroDto> Campos { get; set; } = [];
}

public class CampaniasCampoResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<CampaniaCampoDto> Campanias { get; set; } = [];
}

public class CampaniaCampoResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public CampaniaCampoDto? Campania { get; set; }
}

public class ReconstruccionHistoricoResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<ReconstruccionCampaniaDto> Campanias { get; set; } = [];
}

public class ObjetivoFertilizacionDto
{
    public string ElementoCodigo { get; set; } = string.Empty;
    public string ElementoNombre { get; set; } = string.Empty;
    public decimal ObjetivoKgHa { get; set; }
}

public class PeriodoFertilizacionDto
{
    public byte Orden { get; set; }
    public short Anio { get; set; }
    public byte Mes { get; set; }
    public string? Fenologia { get; set; }
    public string? DesarrolloYemas { get; set; }
    public List<ObjetivoFertilizacionDto> Objetivos { get; set; } = [];
}

public class PresupuestoFertilizacionDto
{
    public long PresupuestoId { get; set; }
    public long CampoCampaniaId { get; set; }
    public string CodigoCampo { get; set; } = string.Empty;
    public string NombreCampo { get; set; } = string.Empty;
    public string CampaniaCodigo { get; set; } = string.Empty;
    public string CampaniaNombre { get; set; } = string.Empty;
    public string CampaniaEstado { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal AreaHa { get; set; }
    public int Version { get; set; }
    public string TipoPresupuesto { get; set; } = "ORIGINAL";
    public long? FuenteCampoCampaniaId { get; set; }
    public decimal? ObjetivoRendimientoTonHa { get; set; }
    public string? Observaciones { get; set; }
    public List<PeriodoFertilizacionDto> Periodos { get; set; } = [];
}

public class GuardarPresupuestoFertilizacionRequest
{
    public long CampoCampaniaId { get; set; }
    public int? VersionEsperada { get; set; }
    public decimal? ObjetivoRendimientoTonHa { get; set; }
    public string? Observaciones { get; set; }
    public List<PeriodoFertilizacionDto> Periodos { get; set; } = [];
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class ControlNutrienteFertilizacionDto
{
    public string ElementoCodigo { get; set; } = string.Empty;
    public string ElementoNombre { get; set; } = string.Empty;
    public decimal PresupuestoKgHa { get; set; }
    public decimal EjecutadoKgHa { get; set; }
    public decimal DesviacionKgHa { get; set; }
    public decimal AvancePorcentaje { get; set; }
}

public class ControlMensualFertilizacionDto
{
    public byte Orden { get; set; }
    public short Anio { get; set; }
    public byte Mes { get; set; }
    public string? Fenologia { get; set; }
    public string EstadoCierre { get; set; } = "ABIERTO";
    public int? CierreVersion { get; set; }
    public DateTime? FechaCierre { get; set; }
    public bool TieneDiscrepancia { get; set; }
    public int Salidas { get; set; }
    public int ItemsPendientes { get; set; }
    public decimal CoberturaPorcentaje { get; set; }
    public List<ControlNutrienteFertilizacionDto> Nutrientes { get; set; } = [];
}

public class ControlFertilizacionDto
{
    public long CampoCampaniaId { get; set; }
    public string CodigoCampo { get; set; } = string.Empty;
    public string NombreCampo { get; set; } = string.Empty;
    public string CampaniaCodigo { get; set; } = string.Empty;
    public string CampaniaEstado { get; set; } = string.Empty;
    public string TipoPresupuesto { get; set; } = string.Empty;
    public decimal AreaTotalHa { get; set; }
    public int PresupuestoVersion { get; set; }
    public int SalidasConsideradas { get; set; }
    public int ItemsPendientes { get; set; }
    public decimal CoberturaPorcentaje { get; set; }
    public List<ControlNutrienteFertilizacionDto> Totales { get; set; } = [];
    public List<ControlMensualFertilizacionDto> Meses { get; set; } = [];
}

public class CerrarMesFertilizacionRequest
{
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
    public short Anio { get; set; }
    public byte Mes { get; set; }
    public string? Motivo { get; set; }
}

public class CampaniasFertilizacionResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<CampaniaCampoDto> Campanias { get; set; } = [];
    public List<MovimientoFertilizacionSinCampaniaDto> Incidencias { get; set; } = [];
}

public class MovimientoFertilizacionSinCampaniaDto
{
    public long SalMatCabId { get; set; }
    public string CodigoCampo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public int Items { get; set; }
}

public class PresupuestoFertilizacionResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public PresupuestoFertilizacionDto? Presupuesto { get; set; }
}

public class AporteSalidaFertilizacionDto
{
    public string ElementoCodigo { get; set; } = string.Empty;
    public string ElementoNombre { get; set; } = string.Empty;
    public decimal EjecutadoKg { get; set; }
    public decimal EjecutadoKgHa { get; set; }
}

public class SalidaFertilizacionDetalleDto
{
    public long SalMatCabId { get; set; }
    public DateTime Fecha { get; set; }
    public string CodigoItem { get; set; } = string.Empty;
    public string NombreItem { get; set; } = string.Empty;
    public decimal CantidadSalida { get; set; }
    public string Unidad { get; set; } = string.Empty;
    public decimal KgProducto { get; set; }
    public string EstadoMovimiento { get; set; } = string.Empty;
    public bool Configurado { get; set; }
    public bool ConfiguracionReferencial { get; set; }
    public string Estado { get; set; } = string.Empty;
    public List<AporteSalidaFertilizacionDto> Aportes { get; set; } = [];
}

public class DetalleSalidasFertilizacionDto
{
    public long CampoCampaniaId { get; set; }
    public string CodigoCampo { get; set; } = string.Empty;
    public string NombreCampo { get; set; } = string.Empty;
    public string CampaniaCodigo { get; set; } = string.Empty;
    public short? Anio { get; set; }
    public byte? Mes { get; set; }
    public bool EsSnapshot { get; set; }
    public bool TieneDiscrepancia { get; set; }
    public List<SalidaFertilizacionDetalleDto> Salidas { get; set; } = [];
}

public class DetalleSalidasFertilizacionResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public DetalleSalidasFertilizacionDto? Detalle { get; set; }
}

public class ControlFertilizacionResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public ControlFertilizacionDto? Control { get; set; }
}
