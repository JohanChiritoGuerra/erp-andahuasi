using Andahuasi.Models;

namespace Andahuasi.Services;

public interface IItemsFertilizacionService
{
    Task<ResumenItems> GetResumenAsync();
    Task<List<ItemAlmacen>> BuscarAsync(string tab, string estado, string? q);
    Task<ItemAlmacen?> GetAsync(string codigo);
    Task GuardarAsync(ConfigItemInput input);
}

/// <summary>
/// DE EJEMPLO: datos en memoria para ver la pantalla funcionando.
/// TODO (conectar datos): implementación real contra las tablas de almacén y configuración de fertilización.
/// </summary>
public class ItemsFertilizacionServiceDemo : IItemsFertilizacionService
{
    private static readonly List<ItemAlmacen> _items = new()
    {
        new() { Codigo = "19070011", Descripcion = "ACCION PLUS EXTRACTO DE ALGAS LIQ. LIGNOKEL", Unidad = "LTS", Presentacion = "liquido" },
        new() { Codigo = "19020121", Descripcion = "ACIDO BORICO FERTILIZANTE X 25KG.", Unidad = "BOLSA" },
        new() { Codigo = "14010289", Descripcion = "ACIDO FOSFORICO 85% USP CH GRADO ALIMENTICIO (PALTOS)", Unidad = "KGS" },
        new() { Codigo = "19070020", Descripcion = "ACIDO FULVICO-ABONO LIQUIDO P. USO AGRICOLA.", Unidad = "LTS", Presentacion = "liquido" },
        new() { Codigo = "19030100", Descripcion = "AMINOKEL-30 AMINO ACIDOS P.APLIC.FOLIAR LIGNOKEL PALTOS", Unidad = "LTS", Presentacion = "liquido" },
        new() { Codigo = "19010050", Descripcion = "NITRATO DE POTASIO X 25 KG", Unidad = "BOLSA", Guardado = true, Fuente = "Ficha técnica del proveedor",
                Nutrientes = new() { new() { Elemento = "N", Valor = 13.5m }, new() { Elemento = "K", Valor = 38.6m } } },
        new() { Codigo = "19010012", Descripcion = "SULFATO DE MAGNESIO HEPTAHIDRATADO X 25 KG", Unidad = "BOLSA", Guardado = true, Modo = "comun" }
    };

    public Task<ResumenItems> GetResumenAsync() => Task.FromResult(new ResumenItems(
        _items.Count,
        _items.Count(i => i.Clasificacion == Clasificacion.Pendiente),
        _items.Count(i => i.Clasificacion == Clasificacion.Explicito),
        _items.Count(i => i.Clasificacion == Clasificacion.Comun)));

    public Task<List<ItemAlmacen>> BuscarAsync(string tab, string estado, string? q)
    {
        IEnumerable<ItemAlmacen> r = _items;
        r = tab switch
        {
            "pendiente" => r.Where(i => i.Clasificacion == Clasificacion.Pendiente),
            "explicito" => r.Where(i => i.Clasificacion == Clasificacion.Explicito),
            "comun" => r.Where(i => i.Clasificacion == Clasificacion.Comun),
            _ => r
        };
        r = estado switch
        {
            "configurado" => r.Where(i => i.Aporte == Aporte.Configurado),
            "sin" => r.Where(i => i.Aporte == Aporte.SinConfigurar),
            "na" => r.Where(i => i.Aporte == Aporte.NoAplica),
            _ => r
        };
        if (!string.IsNullOrWhiteSpace(q))
            r = r.Where(i => (i.Codigo + " " + i.Descripcion).Contains(q, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(r.ToList());
    }

    public Task<ItemAlmacen?> GetAsync(string codigo) => Task.FromResult(_items.FirstOrDefault(i => i.Codigo == codigo));

    public Task GuardarAsync(ConfigItemInput input)
    {
        var it = _items.First(i => i.Codigo == input.Codigo);
        it.Modo = input.Modo; it.Presentacion = input.Presentacion; it.Fuente = input.Fuente;
        it.Nutrientes = input.Nutrientes.Where(n => n.Valor > 0).ToList();
        if (input.Ficha != null) it.FichaNombre = input.Ficha.FileName; // TODO: subir el PDF a almacenamiento
        it.Guardado = true;
        return Task.CompletedTask;
    }
}
