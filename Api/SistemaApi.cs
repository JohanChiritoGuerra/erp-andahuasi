using ErpAndahuasi.Auth;
using ErpAndahuasi.Models;

namespace ErpAndahuasi.Api;

public class SistemaApi
{
    private readonly ErpApiClient _api;
    private readonly IErpSessionAccessor _session;

    public SistemaApi(ErpApiClient api, IErpSessionAccessor session)
    {
        _api = api;
        _session = session;
    }

    private string EmpresaId => _session.Current.EmpresaId;
    private string UsrSistema => _session.Current.UsuaId;

    public Task<UsuarioListaResponse> GetUsuariosAsync(bool? soloActivos = null)
    {
        var qs = soloActivos is null ? string.Empty : $"&soloActivos={soloActivos.Value.ToString().ToLowerInvariant()}";
        return _api.GetAsync<UsuarioListaResponse>($"api/User/Lista?empresaId={EmpresaId}{qs}");
    }

    public Task<RolesUsuarioResponse> GetRolesPorUsuarioAsync(string usuaId) =>
        _api.GetAsync<RolesUsuarioResponse>($"api/Rol/PorUsuario/{Uri.EscapeDataString(usuaId)}?empresaId={EmpresaId}");

    public Task<BaseResponse> GuardarRolesUsuarioAsync(AsignarRolesUsuarioRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PostAsync<BaseResponse>("api/Rol/GuardarRolesUsuario", request);
    }

    public Task<AccesosUsuarioResponse> GetAccesosUsuarioAsync(string usuaId) =>
        _api.GetAsync<AccesosUsuarioResponse>($"api/User/{Uri.EscapeDataString(usuaId)}/Accesos?empresaId={EmpresaId}");

    public Task<CopiarAccesosResponse> CopiarAccesosAsync(string usuaDestinoId, CopiarAccesosRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PostAsync<CopiarAccesosResponse>($"api/User/{Uri.EscapeDataString(usuaDestinoId)}/CopiarDesde", request);
    }

    public Task<RolListaResponse> GetRolesAsync() =>
        _api.GetAsync<RolListaResponse>($"api/Rol/Lista?empresaId={EmpresaId}");

    public Task<RolResponse> CrearRolAsync(CrearRolRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PostAsync<RolResponse>("api/Rol/Crear", request);
    }

    public Task<RolResponse> ActualizarRolAsync(ActualizarRolRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PutAsync<RolResponse>("api/Rol/Actualizar", request);
    }

    public Task<BaseResponse> DeshabilitarRolAsync(int rolId) =>
        _api.PatchAsync<BaseResponse>($"api/Rol/Deshabilitar/{rolId}?empresaId={EmpresaId}", new { });

    public Task<BaseResponse> EliminarRolAsync(int rolId) =>
        _api.DeleteAsync<BaseResponse>($"api/Rol/Eliminar/{rolId}?empresaId={EmpresaId}");

    public Task<RolResponse> ClonarRolAsync(ClonarRolRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PostAsync<RolResponse>($"api/Rol/{request.RolOrigenId}/Clonar", request);
    }

    public Task<RolPermisosArbolResponse> GetPermisosRolAsync(int rolId) =>
        _api.GetAsync<RolPermisosArbolResponse>($"api/Rol/{rolId}/Permisos?empresaId={EmpresaId}");

    public Task<BaseResponse> GuardarPermisosRolAsync(GuardarPermisosRolRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PostAsync<BaseResponse>("api/Rol/GuardarPermisos", request);
    }

    public Task<UsuarioRolListaResponse> GetUsuariosPorRolAsync(int rolId) =>
        _api.GetAsync<UsuarioRolListaResponse>($"api/Rol/{rolId}/Usuarios?empresaId={EmpresaId}");

    public Task<ModuloListaResponse> GetModulosAsync() =>
        _api.GetAsync<ModuloListaResponse>($"api/Modulo/Lista?empresaId={EmpresaId}");

    public async Task<ModuloResponse> GuardarModuloAsync(GuardarModuloRequest request)
    {
        if (request.ModuloId is > 0)
        {
            return await _api.PutAsync<ModuloResponse>("api/Modulo/Actualizar", new
            {
                request.ModuloId,
                request.ModNombre,
                request.ModDescripcion,
                request.ModIcono,
                request.ModOrden,
                request.ModActivo,
                EmpresaId,
                UsrSistema
            });
        }

        return await _api.PostAsync<ModuloResponse>("api/Modulo/Crear", new
        {
            request.ModNombre,
            request.ModDescripcion,
            request.ModIcono,
            request.ModOrden,
            request.ModActivo,
            EmpresaId,
            UsrSistema
        });
    }

    public Task<BaseResponse> DeshabilitarModuloAsync(int moduloId) =>
        _api.PatchAsync<BaseResponse>($"api/Modulo/Deshabilitar/{moduloId}?empresaId={EmpresaId}", new { });

    public Task<BaseResponse> EliminarModuloAsync(int moduloId) =>
        _api.DeleteAsync<BaseResponse>($"api/Modulo/Eliminar/{moduloId}?empresaId={EmpresaId}");

    public Task<CategoriaListaResponse> GetCategoriasAsync(int? moduloId = null)
    {
        var qs = moduloId is > 0 ? $"&moduloId={moduloId}" : string.Empty;
        return _api.GetAsync<CategoriaListaResponse>($"api/Categoria/Lista?empresaId={EmpresaId}{qs}");
    }

    public async Task<CategoriaResponse> GuardarCategoriaAsync(GuardarCategoriaRequest request)
    {
        if (request.CategoriaId is > 0)
        {
            return await _api.PutAsync<CategoriaResponse>("api/Categoria/Actualizar", new
            {
                request.CategoriaId,
                request.ModuloId,
                request.CatNombre,
                request.CatDescripcion,
                request.CatIcono,
                request.CatOrden,
                request.CatActivo,
                EmpresaId,
                UsrSistema
            });
        }

        return await _api.PostAsync<CategoriaResponse>("api/Categoria/Crear", new
        {
            request.ModuloId,
            request.CatNombre,
            request.CatDescripcion,
            request.CatIcono,
            request.CatOrden,
            request.CatActivo,
            EmpresaId,
            UsrSistema
        });
    }

    public Task<BaseResponse> DeshabilitarCategoriaAsync(int categoriaId, int moduloId) =>
        _api.PatchAsync<BaseResponse>($"api/Categoria/Deshabilitar/{categoriaId}/{moduloId}?empresaId={EmpresaId}", new { });

    public Task<BaseResponse> EliminarCategoriaAsync(int categoriaId, int moduloId) =>
        _api.DeleteAsync<BaseResponse>($"api/Categoria/Eliminar/{categoriaId}/{moduloId}?empresaId={EmpresaId}");

    public Task<AccesoListaResponse> GetAccesosAsync(int? moduloId = null, int? categoriaId = null)
    {
        var qs = moduloId is > 0 ? $"&moduloId={moduloId}" : string.Empty;
        if (categoriaId is > 0) qs += $"&categoriaId={categoriaId}";
        return _api.GetAsync<AccesoListaResponse>($"api/Acceso/Lista?empresaId={EmpresaId}{qs}");
    }

    public async Task<AccesoResponse> GuardarAccesoAsync(GuardarAccesoRequest request)
    {
        var tipo = string.IsNullOrWhiteSpace(request.AccTipo) ? 'F' : request.AccTipo[0];
        if (request.AccesoId is > 0)
        {
            return await _api.PutAsync<AccesoResponse>("api/Acceso/Actualizar", new
            {
                request.AccesoId,
                request.CategoriaId,
                request.ModuloId,
                request.AccNombre,
                request.AccDescripcion,
                AccTipo = tipo,
                request.AccURL,
                request.AccIcono,
                request.AccOrden,
                request.AccActivo,
                EmpresaId,
                UsrSistema
            });
        }

        return await _api.PostAsync<AccesoResponse>("api/Acceso/Crear", new
        {
            request.CategoriaId,
            request.ModuloId,
            request.AccNombre,
            request.AccDescripcion,
            AccTipo = tipo,
            request.AccURL,
            request.AccIcono,
            request.AccOrden,
            request.AccActivo,
            EmpresaId,
            UsrSistema
        });
    }

    public Task<BaseResponse> DeshabilitarAccesoAsync(int accesoId, int categoriaId, int moduloId) =>
        _api.PatchAsync<BaseResponse>($"api/Acceso/Deshabilitar/{accesoId}/{categoriaId}/{moduloId}?empresaId={EmpresaId}", new { });

    public Task<BaseResponse> EliminarAccesoAsync(int accesoId, int categoriaId, int moduloId) =>
        _api.DeleteAsync<BaseResponse>($"api/Acceso/Eliminar/{accesoId}/{categoriaId}/{moduloId}?empresaId={EmpresaId}");

    public Task<RolAccesoListaResponse> GetAccesosPorRolAsync(int accesoId, int categoriaId, int moduloId) =>
        _api.GetAsync<RolAccesoListaResponse>($"api/Acceso/AccesosPorRol/{accesoId}/{categoriaId}/{moduloId}?empresaId={EmpresaId}");

    public Task<BaseResponse> ActualizarRolAccesoAsync(ActualizarRolAccesoFlagsRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PatchAsync<BaseResponse>("api/Acceso/ActualizarRolAcceso", request);
    }

    public Task<BaseResponse> RevocarRolAccesoAsync(int rolId, int accesoId, int categoriaId, int moduloId) =>
        _api.DeleteAsync<BaseResponse>($"api/Acceso/RevocarRolAcceso/{rolId}/{accesoId}/{categoriaId}/{moduloId}?empresaId={EmpresaId}");

    public Task<UsuarioAccesoDirectoListaResponse> GetUsuariosDirectosAsync(int accesoId, int categoriaId, int moduloId) =>
        _api.GetAsync<UsuarioAccesoDirectoListaResponse>($"api/Acceso/UsuariosDirectos/{accesoId}/{categoriaId}/{moduloId}?empresaId={EmpresaId}");

    public Task<UsuarioSimpleListaResponse> GetUsuariosDisponiblesAsync(int accesoId, int categoriaId, int moduloId) =>
        _api.GetAsync<UsuarioSimpleListaResponse>($"api/Acceso/UsuariosDisponiblesParaAsignar/{accesoId}/{categoriaId}/{moduloId}?empresaId={EmpresaId}");

    public Task<BaseResponse> AsignarAccesoDirectoAsync(AccesoDirectoRequest request) =>
        _api.PostAsync<BaseResponse>("api/Acceso/AsignarAccesoDirecto", new
        {
            request.UsuaId,
            request.AccesoId,
            request.CategoriaId,
            request.ModuloId,
            request.Desktop,
            request.Web,
            request.Mobile,
            EmpresaId,
            UsrSistema
        });

    public Task<BaseResponse> ActualizarAccesoDirectoAsync(AccesoDirectoRequest request) =>
        _api.PatchAsync<BaseResponse>("api/Acceso/ActualizarAccesoDirecto", new
        {
            request.UsuaId,
            request.AccesoId,
            request.CategoriaId,
            request.ModuloId,
            request.Desktop,
            request.Web,
            request.Mobile,
            EmpresaId,
            UsrSistema
        });

    public Task<BaseResponse> RevocarAccesoDirectoAsync(string usuaId, int accesoId, int categoriaId, int moduloId) =>
        _api.DeleteAsync<BaseResponse>($"api/Acceso/RevocarAccesoDirecto/{Uri.EscapeDataString(usuaId)}/{accesoId}/{categoriaId}/{moduloId}?empresaId={EmpresaId}&usuarioSistema={Uri.EscapeDataString(UsrSistema)}");

    public Task<MenuUsuarioResponse> GetMenuUsuarioAsync() =>
        _api.GetAsync<MenuUsuarioResponse>($"api/Menu/ObtenerMenuUsuario?usuarioId={Uri.EscapeDataString(UsrSistema)}&empresaId={Uri.EscapeDataString(EmpresaId)}");
}

public class RrhhApi
{
    private readonly ErpApiClient _api;
    private readonly IErpSessionAccessor _session;

    public RrhhApi(ErpApiClient api, IErpSessionAccessor session)
    {
        _api = api;
        _session = session;
    }

    public Task<PerfilTrabajadorResponse> GetPerfilAsync() =>
        _api.PostAsync<PerfilTrabajadorResponse>("api/PerfilTrabajador/ObtenerPerfilTrabajador", new
        {
            TrabId = _session.Current.TrabId,
            EmpresaId = _session.Current.EmpresaId
        });

    public Task<PerfilTrabajadorResponse> ActualizarPerfilAsync(ActualizarPerfilRequest request)
    {
        request.TrabId = _session.Current.TrabId;
        request.EmpresaId = _session.Current.EmpresaId;
        return _api.PutAsync<PerfilTrabajadorResponse>("api/PerfilTrabajador/ActualizarPerfil", request);
    }
}
