namespace Andahuasi.Models;

// ---- Menú (3 niveles). Icono = código Remix guardado en BD, p. ej. "ri-plant-line" ----
public record Acceso(int Id, string Nombre, string Ruta, int? Badge = null);
public record Categoria(int Id, string Nombre, string Icono, List<Acceso> Accesos);
public record Modulo(int Id, string Nombre, string Icono, List<Categoria> Categorias);

public class MenuViewModel
{
    public List<Modulo> Modulos { get; set; } = new();
    public string RutaActual { get; set; } = "/";
    public bool EsActual(Acceso a) => string.Equals(a.Ruta.TrimEnd('/'), RutaActual.TrimEnd('/'), StringComparison.OrdinalIgnoreCase);
}

// ---- Usuario y notificaciones ----
public record UsuarioActual(string Nombre, string Cargo, string? FotoUrl);

public record Notificacion(int Id, string Titulo, string Modulo, DateTime Fecha, bool Leida, string Url)
{
    public string Hace
    {
        get
        {
            var d = DateTime.Now - Fecha;
            if (d.TotalMinutes < 60) return $"hace {Math.Max(1, (int)d.TotalMinutes)} min";
            if (d.TotalHours < 24) return $"hace {(int)d.TotalHours} h";
            if (d.TotalDays < 2) return "ayer";
            return Fecha.ToString("dd/MM/yyyy");
        }
    }
}
