using ErpAndahuasi.Auth;
using ErpAndahuasi.Models;

namespace ErpAndahuasi.Api;

public class ComercializacionApi
{
    public const int EmpresaSoft = 1;
    public const int PuntoVenta = 1;

    private readonly ErpApiClient _api;
    private readonly IErpSessionAccessor _session;

    public ComercializacionApi(ErpApiClient api, IErpSessionAccessor session)
    {
        _api = api;
        _session = session;
    }

    private string Usuario => _session.Current.UsuaId;

    public Task<PorDespacharResponse> PorDespacharAsync(int idArticulo) =>
        _api.PostAsync<PorDespacharResponse>(
            "api/Comercializacion/DespachoAzucar/Despacho/ObtenerListadoItemPorDespachar",
            new
            {
                IdEmpresa = EmpresaSoft,
                IdUser = 0,
                Usuario,
                Id_puntventa = PuntoVenta,
                Id_articulo = idArticulo
            });

    public Task<ComercializacionAccionResponse> DespacharAsync(int idFactdetal, DateTime fecha) =>
        _api.PostAsync<ComercializacionAccionResponse>(
            "api/Comercializacion/DespachoAzucar/Despacho/Despachar",
            new
            {
                Id_factdetal = idFactdetal,
                Fecha = fecha,
                IdEmpresa = EmpresaSoft,
                IdUser = 0,
                Usuario,
                Opcion = 1
            });

    public Task<OrdenesInternasResponse> OrdenesInternasAsync(int idArticulo) =>
        _api.PostAsync<OrdenesInternasResponse>(
            "api/Comercializacion/DespachoAzucar/OrdenInterna/ObtenerListadoItemOrdenInterna",
            new
            {
                IdEmpresa = EmpresaSoft,
                Id_articulo = idArticulo
            });

    public Task<ComercializacionAccionResponse> RegistrarOrdenAsync(AzucarRegistrarCommand command) =>
        _api.PostAsync<ComercializacionAccionResponse>(
            "api/Comercializacion/DespachoAzucar/OrdenInterna/RegistrarOrdenInterna",
            new
            {
                IdEmpresa = EmpresaSoft,
                Id_articulo = command.IdArticulo,
                command.Numero,
                command.Fecha,
                command.Destino,
                command.Cantidad,
                IdUser = 0,
                Usuario
            });

    public Task<DespachadosResponse> DespachadosAsync(int idArticulo, DateTime fecha, bool todoElMes) =>
        _api.PostAsync<DespachadosResponse>(
            "api/Comercializacion/DespachoAzucar/Reporte/ObtenerListadoItemDespachado",
            new
            {
                Fecha = fecha,
                IdEmpresa = EmpresaSoft,
                IdUser = 0,
                Usuario,
                Id_puntventa = PuntoVenta,
                Id_articulo = idArticulo,
                todoElMes
            });

    public Task<ComercializacionAccionResponse> AnularDespachoAsync(int idInvmaest) =>
        _api.DeleteAsync<ComercializacionAccionResponse>(
            $"api/Comercializacion/DespachoAzucar/Reporte/AnularDespacho/{idInvmaest}");
}
