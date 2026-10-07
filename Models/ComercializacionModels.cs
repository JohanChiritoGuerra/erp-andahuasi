namespace ErpAndahuasi.Models;

public class AzucarListadoQuery
{
    public int IdArticulo { get; set; } = 2;
}

public class AzucarDespacharCommand
{
    public int IdFactdetal { get; set; }
    public DateTime Fecha { get; set; }
}

public class AzucarDespachadosQuery
{
    public int IdArticulo { get; set; } = 2;
    public DateTime Fecha { get; set; }
    public bool TodoElMes { get; set; }
}

public class AzucarRegistrarCommand
{
    public int IdArticulo { get; set; }
    public string? Numero { get; set; }
    public DateTime? Fecha { get; set; }
    public string? Destino { get; set; }
    public decimal? Cantidad { get; set; }
}

public class AzucarAnularCommand
{
    public int IdInvmaest { get; set; }
}

public class ItemPorDespachar
{
    public int Id_factmaest { get; set; }
    public int Id_factdetal { get; set; }
    public DateTime? FECHA { get; set; }
    public string? CLIENTE { get; set; }
    public string? TIPO { get; set; }
    public string? DNI_RUC { get; set; }
    public string? CONDICION { get; set; }
    public string? COMPROBANTE { get; set; }
    public string? DESCRIPCION { get; set; }
    public decimal? CANTIDAD { get; set; }
    public decimal? PRECIO { get; set; }
    public decimal? VALOR_DE_VENTA { get; set; }
    public decimal? TOTAL { get; set; }
}

public class PorDespacharResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<ItemPorDespachar> ItemsPorDespachar { get; set; } = [];
}

public class ItemOrdenInterna
{
    public int Id_invmaest { get; set; }
    public int Id_invdetal { get; set; }
    public string? Numero { get; set; }
    public DateTime Fecha { get; set; }
    public decimal Cantidad { get; set; }
    public string? Producto { get; set; }
    public string? Destino { get; set; }
}

public class OrdenesInternasResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<ItemOrdenInterna> ItemsOrdenInterna { get; set; } = [];
}

public class ItemDespachado
{
    public int Id_factmaest { get; set; }
    public int Id_factdetal { get; set; }
    public DateTime? FECHA_ATENCION { get; set; }
    public DateTime? FECHA { get; set; }
    public string? CLIENTE { get; set; }
    public string? TIPO { get; set; }
    public string? DNI_RUC { get; set; }
    public string? CONDICION { get; set; }
    public string? COMPROBANTE { get; set; }
    public string? DESCRIPCION { get; set; }
    public decimal? CANTIDAD { get; set; }
    public decimal? PRECIO { get; set; }
    public decimal? VALOR_DE_VENTA { get; set; }
    public decimal? TOTAL { get; set; }
    public int? Id_invmaest { get; set; }
    public int? Id_invdetal { get; set; }
    public int? Id_articulo { get; set; }
}

public class DespachadosResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<ItemDespachado> ItemsDespachados { get; set; } = [];
}

public class ComercializacionAccionResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
}
