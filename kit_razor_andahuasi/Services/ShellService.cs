using System.Security.Claims;
using Andahuasi.Models;

namespace Andahuasi.Services;

public interface IShellService
{
    Task<List<Modulo>> GetMenuAsync(ClaimsPrincipal user);
    Task<UsuarioActual> GetUsuarioAsync(ClaimsPrincipal user);
    Task<List<Notificacion>> GetNotificacionesAsync(ClaimsPrincipal user);
}

/// <summary>
/// Implementación DE EJEMPLO con datos fijos para ver el diseño funcionando.
/// TODO (conectar datos): crear ShellService real que lea de la base de datos y
/// registrarlo en Program.cs en lugar de este.
/// </summary>
public class ShellServiceDemo : IShellService
{
    public Task<List<Modulo>> GetMenuAsync(ClaimsPrincipal user)
    {
        // TODO: SELECT de Módulos/Categorías/Accesos permitidos para el rol del usuario, ordenados.
        var menu = new List<Modulo>
        {
            new(1, "Administración", "ri-settings-3-line", new()
            {
                new(11, "Gestión de usuarios", "ri-team-line", new() { new(111, "Usuarios", "/Admin/Usuarios") }),
                new(12, "Gestión de accesos", "ri-shield-keyhole-line", new() { new(121, "Accesos", "/Admin/Accesos") })
            }),
            new(2, "Logística", "ri-truck-line", new()
            {
                new(21, "Gestión Operativa", "ri-settings-4-line", new()
                {
                    new(211, "Consultar - solicitud de compra", "/Logistica/SolicitudCompra"),
                    new(212, "Registrar - abastecimiento diesel", "/Logistica/Diesel/Registrar")
                })
            }),
            new(3, "Paltos", "ri-plant-line", new()
            {
                new(31, "Fertilización", "ri-flask-line", new()
                {
                    new(311, "Presupuesto de fertilización", "/Paltos/Fertilizacion/Presupuesto"),
                    new(312, "Control de fertilización", "/Paltos/Fertilizacion/Control"),
                    new(313, "Configuración de ítems", "/Paltos/Fertilizacion/ConfiguracionItems")
                }),
                new(32, "Campos y campañas", "ri-map-2-line", new() { new(321, "Campos y campañas", "/Paltos/Campos") })
            }),
            new(4, "Mantenimiento", "ri-tools-line", new()
            {
                new(41, "Órdenes de Trabajo", "ri-file-list-3-line", new()
                {
                    new(411, "Ver OT Asignadas a Mí", "/Mantenimiento/OT/Asignadas", 12),
                    new(412, "Crear OT", "/Mantenimiento/OT/Crear")
                }),
                new(42, "Solicitudes de Trabajo", "ri-inbox-line", new() { new(421, "Solicitudes Recibidas", "/Mantenimiento/Solicitudes", 4) })
            })
        };
        return Task.FromResult(menu);
    }

    public Task<UsuarioActual> GetUsuarioAsync(ClaimsPrincipal user)
        // TODO: nombre y cargo del usuario autenticado (claims o tabla de personal). FotoUrl null = silueta.
        => Task.FromResult(new UsuarioActual("Chirito Guerra, Johan", "Jefe Dpto. de Sistemas", null));

    public Task<List<Notificacion>> GetNotificacionesAsync(ClaimsPrincipal user)
        // TODO: últimas 10 notificaciones del usuario.
        => Task.FromResult(new List<Notificacion>
        {
            new(1, "OT-2418 asignada a ti", "Mantenimiento", DateTime.Now.AddMinutes(-12), false, "/Mantenimiento/OT/2418"),
            new(2, "Solicitud de trabajo aprobada", "Mantenimiento", DateTime.Now.AddHours(-1), false, "/Mantenimiento/Solicitudes"),
            new(3, "Presupuesto de fertilización actualizado", "Paltos", DateTime.Now.AddHours(-3), true, "/Paltos/Fertilizacion/Presupuesto")
        });
}
