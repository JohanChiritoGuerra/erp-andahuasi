using System.ComponentModel.DataAnnotations;

namespace Andahuasi.Models;

public enum Clasificacion { Pendiente, Explicito, Comun }
public enum Aporte { SinConfigurar, Configurado, NoAplica }

public class NutrienteItem
{
    [Required] public string Elemento { get; set; } = "N";
    [Range(0, 2000, ErrorMessage = "Máximo 2000 (g/L) o 100 (%).")] public decimal? Valor { get; set; }
}

public class ItemAlmacen
{
    public string Codigo { get; set; } = "";
    public string Descripcion { get; set; } = "";
    public string Unidad { get; set; } = "";
    public string Modo { get; set; } = "nutriente";        // nutriente | comun
    public string Presentacion { get; set; } = "solido";   // solido | liquido
    public List<NutrienteItem> Nutrientes { get; set; } = new();
    public string? Fuente { get; set; }
    public string? FichaNombre { get; set; }
    public bool Guardado { get; set; }

    public Clasificacion Clasificacion =>
        !Guardado ? Clasificacion.Pendiente : Modo == "comun" ? Clasificacion.Comun :
        Nutrientes.Any(n => n.Valor > 0) ? Clasificacion.Explicito : Clasificacion.Pendiente;

    public Aporte Aporte => Clasificacion switch
    {
        Clasificacion.Comun => Aporte.NoAplica,
        Clasificacion.Explicito => Aporte.Configurado,
        _ => Aporte.SinConfigurar
    };

    // Texto y variante de pill según el sistema de diseño (success/warning/danger/info/neutral)
    public (string Texto, string Clase) PillClasificacion => Clasificacion switch
    {
        Clasificacion.Explicito => ("Datos explícitos", "pill-success"),
        Clasificacion.Comun => ("Consumo común", "pill-info"),
        _ => ("Pendiente", "pill-warning")
    };
    public (string Texto, string Clase) PillAporte => Aporte switch
    {
        Aporte.Configurado => ("Configurado", "pill-success"),
        Aporte.NoAplica => ("No aplica", "pill"),
        _ => ("Sin configurar", "pill-danger")
    };
}

public record ResumenItems(int Todos, int Pendientes, int Configurados, int ConsumoComun);

public class ConfigItemInput
{
    [Required] public string Codigo { get; set; } = "";
    public string Modo { get; set; } = "nutriente";
    public string Presentacion { get; set; } = "solido";
    public List<NutrienteItem> Nutrientes { get; set; } = new();
    [StringLength(200)] public string? Fuente { get; set; }
    public IFormFile? Ficha { get; set; }

    public static ConfigItemInput Desde(ItemAlmacen i) => new()
    {
        Codigo = i.Codigo, Modo = i.Modo, Presentacion = i.Presentacion,
        Nutrientes = i.Nutrientes.Select(n => new NutrienteItem { Elemento = n.Elemento, Valor = n.Valor }).ToList(),
        Fuente = i.Fuente
    };
}
