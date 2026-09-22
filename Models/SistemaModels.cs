namespace ErpAndahuasi.Models;

public class UsuarioDto
{
    public string UsuaId { get; set; } = string.Empty;
    public string UsuaApePat { get; set; } = string.Empty;
    public string UsuaApeMat { get; set; } = string.Empty;
    public string UsuaNombres { get; set; } = string.Empty;
    public string UsuaDNI { get; set; } = string.Empty;
    public string? UsuaDireccion { get; set; }
    public int? UsuaEstado { get; set; }
    public string? TrabId { get; set; }
    public string? CorreoInterno { get; set; }
    public string? NombreCorto { get; set; }
    public string NombreCompleto => $"{UsuaApePat} {UsuaApeMat} {UsuaNombres}".Trim();
}

public class UsuarioListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<UsuarioDto> Usuarios { get; set; } = [];
}

public class RolDto
{
    public int RolId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; }
    public int CantidadUsuarios { get; set; }
    public int CantidadAccesos { get; set; }
}

public class RolListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<RolDto> Roles { get; set; } = [];
}

public class RolResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public RolDto? Rol { get; set; }
}

public class CrearRolRequest
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class ActualizarRolRequest : CrearRolRequest
{
    public int RolId { get; set; }
}

public class ClonarRolRequest
{
    public int RolOrigenId { get; set; }
    public string NuevoNombre { get; set; } = string.Empty;
    public string? NuevaDescripcion { get; set; }
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class ModuloDto
{
    public int ModuloId { get; set; }
    public string ModNombre { get; set; } = string.Empty;
    public string? ModDescripcion { get; set; }
    public string? ModIcono { get; set; }
    public int? ModOrden { get; set; }
    public bool ModActivo { get; set; }
    public int CantidadCategorias { get; set; }
    public int CantidadAccesos { get; set; }
}

public class ModuloListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<ModuloDto> Modulos { get; set; } = [];
}

public class ModuloResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public ModuloDto? Modulo { get; set; }
}

public class GuardarModuloRequest
{
    public int? ModuloId { get; set; }
    public string ModNombre { get; set; } = string.Empty;
    public string? ModDescripcion { get; set; }
    public string? ModIcono { get; set; }
    public int? ModOrden { get; set; }
    public bool ModActivo { get; set; } = true;
}

public class CategoriaDto
{
    public int CategoriaId { get; set; }
    public int ModuloId { get; set; }
    public string ModuloNombre { get; set; } = string.Empty;
    public string CatNombre { get; set; } = string.Empty;
    public string? CatDescripcion { get; set; }
    public string? CatIcono { get; set; }
    public int? CatOrden { get; set; }
    public bool CatActivo { get; set; }
    public int CantidadAccesos { get; set; }
}

public class CategoriaListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<CategoriaDto> Categorias { get; set; } = [];
}

public class CategoriaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public CategoriaDto? Categoria { get; set; }
}

public class GuardarCategoriaRequest
{
    public int? CategoriaId { get; set; }
    public int ModuloId { get; set; }
    public string CatNombre { get; set; } = string.Empty;
    public string? CatDescripcion { get; set; }
    public string? CatIcono { get; set; }
    public int? CatOrden { get; set; }
    public bool CatActivo { get; set; } = true;
}

public class AccesoDto
{
    public int AccesoId { get; set; }
    public int CategoriaId { get; set; }
    public int ModuloId { get; set; }
    public string ModuloNombre { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public string AccNombre { get; set; } = string.Empty;
    public string? AccDescripcion { get; set; }
    public string AccTipo { get; set; } = "F";
    public string? AccURL { get; set; }
    public string? AccIcono { get; set; }
    public int? AccOrden { get; set; }
    public bool AccActivo { get; set; }
}

public class AccesoListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<AccesoDto> Accesos { get; set; } = [];
}

public class AccesoResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public AccesoDto? Acceso { get; set; }
}

public class GuardarAccesoRequest
{
    public int? AccesoId { get; set; }
    public int CategoriaId { get; set; }
    public int ModuloId { get; set; }
    public string AccNombre { get; set; } = string.Empty;
    public string? AccDescripcion { get; set; }
    public string AccTipo { get; set; } = "F";
    public string? AccURL { get; set; }
    public string? AccIcono { get; set; }
    public int? AccOrden { get; set; }
    public bool AccActivo { get; set; } = true;
}

public class AccesoMenuData
{
    public int AccesoId { get; set; }
    public string AccNombre { get; set; } = string.Empty;
    public string? AccURL { get; set; }
    public string? AccIcono { get; set; }
    public string AccTipo { get; set; } = "F";
    public int? AccOrden { get; set; }
}

public class CategoriaMenuData
{
    public int CategoriaId { get; set; }
    public string CatNombre { get; set; } = string.Empty;
    public string? CatIcono { get; set; }
    public int? CatOrden { get; set; }
    public List<AccesoMenuData> Accesos { get; set; } = [];
}

public class ModuloMenuData
{
    public int ModuloId { get; set; }
    public string ModNombre { get; set; } = string.Empty;
    public string? ModIcono { get; set; }
    public int? CatOrden { get; set; }
    public int? ModOrden { get; set; }
    public List<CategoriaMenuData> Categorias { get; set; } = [];
}

public class MenuUsuarioResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<ModuloMenuData> Modulos { get; set; } = [];
}

public class AccesoPermisoDto
{
    public int AccesoId { get; set; }
    public string AccNombre { get; set; } = string.Empty;
    public string AccTipo { get; set; } = string.Empty;
    public bool AccActivo { get; set; }
    public bool Asignado { get; set; }
    public bool Desktop { get; set; }
    public bool Web { get; set; }
    public bool Mobile { get; set; }
}

public class CategoriaPermisoDto
{
    public int CategoriaId { get; set; }
    public string CatNombre { get; set; } = string.Empty;
    public string? CatIcono { get; set; }
    public List<AccesoPermisoDto> Accesos { get; set; } = [];
}

public class ModuloPermisoDto
{
    public int ModuloId { get; set; }
    public string ModNombre { get; set; } = string.Empty;
    public string? ModIcono { get; set; }
    public List<CategoriaPermisoDto> Categorias { get; set; } = [];
}

public class RolPermisosArbolResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public int RolId { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public List<ModuloPermisoDto> Modulos { get; set; } = [];
}

public class PermisoRolItem
{
    public int AccesoId { get; set; }
    public int CategoriaId { get; set; }
    public int ModuloId { get; set; }
    public bool Desktop { get; set; }
    public bool Web { get; set; }
    public bool Mobile { get; set; }
}

public class GuardarPermisosRolRequest
{
    public int RolId { get; set; }
    public List<PermisoRolItem> Permisos { get; set; } = [];
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class RolUsuarioCheckDto
{
    public int RolId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; }
    public bool Asignado { get; set; }
}

public class RolesUsuarioResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public string UsuaId { get; set; } = string.Empty;
    public List<RolUsuarioCheckDto> Roles { get; set; } = [];
}

public class AsignarRolesUsuarioRequest
{
    public string UsuaId { get; set; } = string.Empty;
    public List<int> RolIds { get; set; } = [];
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class UsuarioRolDto
{
    public string UsuaId { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreCorto { get; set; } = string.Empty;
    public bool TieneRol { get; set; }
    public bool Activo { get; set; }
}

public class UsuarioRolListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<UsuarioRolDto> Usuarios { get; set; } = [];
}

public class RolAccesoDto
{
    public int RolId { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public string? RolDescripcion { get; set; }
    public bool RolEstado { get; set; }
    public bool Desktop { get; set; }
    public bool Web { get; set; }
    public bool Mobile { get; set; }
    public bool TieneAsignacion { get; set; }
}

public class RolAccesoListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<RolAccesoDto>? Data { get; set; }
}

public class ActualizarRolAccesoFlagsRequest
{
    public int RolId { get; set; }
    public int AccesoId { get; set; }
    public int CategoriaId { get; set; }
    public int ModuloId { get; set; }
    public bool Desktop { get; set; }
    public bool Web { get; set; }
    public bool Mobile { get; set; }
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class UsuarioAccesoDirectoDto
{
    public string UsuaId { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public bool Desktop { get; set; }
    public bool Web { get; set; }
    public bool Mobile { get; set; }
    public bool Activo { get; set; }
}

public class UsuarioSimpleDto
{
    public string UsuaId { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
}

public class UsuarioAccesoDirectoListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<UsuarioAccesoDirectoDto>? Data { get; set; }
}

public class UsuarioSimpleListaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<UsuarioSimpleDto>? Data { get; set; }
}

public class AccesoDirectoRequest
{
    public string UsuaId { get; set; } = string.Empty;
    public int AccesoId { get; set; }
    public int CategoriaId { get; set; }
    public int ModuloId { get; set; }
    public bool Desktop { get; set; }
    public bool Web { get; set; }
    public bool Mobile { get; set; }
}

public class AccesoCompletoUsuarioDto
{
    public int AccesoId { get; set; }
    public string AccNombre { get; set; } = string.Empty;
    public string? AccURL { get; set; }
    public string AccTipo { get; set; } = string.Empty;
    public string ModNombre { get; set; } = string.Empty;
    public string CatNombre { get; set; } = string.Empty;
    public string Origen { get; set; } = string.Empty;
    public string? OrigenNombre { get; set; }
    public bool Web { get; set; }
    public bool Desktop { get; set; }
    public bool Mobile { get; set; }
}

public class AccesosUsuarioResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public List<AccesoCompletoUsuarioDto> Accesos { get; set; } = [];
}

public class CopiarAccesosRequest
{
    public string UsuaOrigenId { get; set; } = string.Empty;
    public bool CopiarRoles { get; set; } = true;
    public bool CopiarAccesosDirect { get; set; } = true;
    public bool Reemplazar { get; set; }
    public string EmpresaId { get; set; } = string.Empty;
    public string UsrSistema { get; set; } = string.Empty;
}

public class CopiarAccesosResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();
    public int RolesCopiados { get; set; }
    public int AccesosDirectosCopiados { get; set; }
}
