using ErpAndahuasi.Auth;
using ErpAndahuasi.Models;

namespace ErpAndahuasi.Api;

public class PaltosApi
{
    private readonly ErpApiClient _api;
    private readonly IErpSessionAccessor _session;

    public PaltosApi(ErpApiClient api, IErpSessionAccessor session)
    {
        _api = api;
        _session = session;
    }

    private string EmpresaId => _session.Current.EmpresaId;
    private string UsrSistema => _session.Current.UsuaId;

    public Task<ItemFertilizacionListaResponse> GetItemsAsync() =>
        _api.GetAsync<ItemFertilizacionListaResponse>($"api/Paltos/FertilizacionItems/Lista?empresaId={EmpresaId}");

    public Task<ItemFertilizacionResponse> GetItemAsync(string grp, string cls, string ite) =>
        _api.GetAsync<ItemFertilizacionResponse>($"api/Paltos/FertilizacionItems/Configuracion/{grp}/{cls}/{ite}?empresaId={EmpresaId}");

    public Task<ItemFertilizacionResponse> GuardarItemAsync(GuardarItemFertilizacionRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PutAsync<ItemFertilizacionResponse>("api/Paltos/FertilizacionItems/Configuracion", request);
    }

    public Task<ElementoQuimicoListaResponse> GetElementosAsync() =>
        _api.GetAsync<ElementoQuimicoListaResponse>($"api/Paltos/FertilizacionItems/Elementos?empresaId={EmpresaId}");

    public Task<byte[]?> GetImagenItemAsync(string grp, string cls, string ite) =>
        _api.GetBytesAsync($"api/Paltos/FertilizacionItems/Imagen/{grp}/{cls}/{ite}?empresaId={EmpresaId}");

    public Task<BaseResponse> GuardarImagenItemAsync(string grp, string cls, string ite, Stream archivo, string fileName)
    {
        var form = new MultipartFormDataContent
        {
            { new StreamContent(archivo), "archivo", fileName },
            { new StringContent(EmpresaId), "empresaId" },
            { new StringContent(UsrSistema), "usuarioSistema" }
        };
        return _api.SendMultipartAsync<BaseResponse>(HttpMethod.Put, $"api/Paltos/FertilizacionItems/Imagen/{grp}/{cls}/{ite}", form);
    }

    public Task<DocumentoFertilizacionResponse> CargarDocumentoAsync(string grp, string cls, string ite, string vigenciaDesde, string tipoDocumento, Stream archivo, string fileName)
    {
        var form = new MultipartFormDataContent
        {
            { new StreamContent(archivo), "archivo", fileName },
            { new StringContent(EmpresaId), "empresaId" },
            { new StringContent(UsrSistema), "usuarioSistema" },
            { new StringContent(grp), "grpAlmId" },
            { new StringContent(cls), "clsAlmId" },
            { new StringContent(ite), "iteAlmId" },
            { new StringContent(vigenciaDesde), "vigenciaDesde" },
            { new StringContent(tipoDocumento), "tipoDocumento" }
        };
        return _api.SendMultipartAsync<DocumentoFertilizacionResponse>(HttpMethod.Post, "api/Paltos/FertilizacionItems/Documento", form);
    }

    public Task<BaseResponse> EliminarDocumentoAsync(long documentoId) =>
        _api.DeleteAsync<BaseResponse>($"api/Paltos/FertilizacionItems/Documento/{documentoId}?empresaId={Uri.EscapeDataString(EmpresaId)}&usuarioSistema={Uri.EscapeDataString(UsrSistema)}");

    public Task<byte[]?> ObtenerDocumentoAsync(long documentoId) =>
        _api.GetBytesAsync($"api/Paltos/FertilizacionItems/Documento/{documentoId}?empresaId={Uri.EscapeDataString(EmpresaId)}");

    public Task<CampaniasFertilizacionResponse> GetCampaniasFertilizacionAsync() =>
        _api.GetAsync<CampaniasFertilizacionResponse>($"api/Paltos/PresupuestoFertilizacion/Campanias?empresaId={EmpresaId}");

    public Task<CamposPaltoResponse> GetCamposAsync(bool incluirInactivos = true) =>
        _api.GetAsync<CamposPaltoResponse>($"api/Paltos/CamposCampanias?empresaId={EmpresaId}&incluirInactivos={incluirInactivos.ToString().ToLowerInvariant()}");

    public Task<CampoPaltoResponse> GetCampoAsync(long campoPaltoId) =>
        _api.GetAsync<CampoPaltoResponse>($"api/Paltos/CamposCampanias/Campo/{campoPaltoId}?empresaId={EmpresaId}");

    public Task<CatalogoCamposResponse> GetCatalogoCamposAsync(string buscar = "") =>
        _api.GetAsync<CatalogoCamposResponse>($"api/Paltos/CamposCampanias/Catalogo?empresaId={EmpresaId}&buscar={Uri.EscapeDataString(buscar)}");

    public Task<CampoPaltoResponse> GuardarCampoAsync(GuardarCampoPaltoRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PutAsync<CampoPaltoResponse>("api/Paltos/CamposCampanias/Campo", request);
    }

    public Task<BaseResponse> CambiarEstadoCampoAsync(long campoPaltoId, bool activo) =>
        _api.PatchAsync<BaseResponse>($"api/Paltos/CamposCampanias/Campo/{campoPaltoId}/Estado?empresaId={EmpresaId}&usrSistema={Uri.EscapeDataString(UsrSistema)}&activo={activo.ToString().ToLowerInvariant()}", new { });

    public Task<CampaniasCampoResponse> GetCampaniasCampoAsync(string? estado = null, long? campoPaltoId = null)
    {
        var qs = estado is null ? string.Empty : $"&estado={Uri.EscapeDataString(estado)}";
        if (campoPaltoId is > 0) qs += $"&campoPaltoId={campoPaltoId}";
        return _api.GetAsync<CampaniasCampoResponse>($"api/Paltos/CamposCampanias/Campanias?empresaId={EmpresaId}{qs}");
    }

    public Task<CampaniaCampoResponse> CrearCampaniaAsync(CrearCampaniaCampoRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PostAsync<CampaniaCampoResponse>("api/Paltos/CamposCampanias/Campania", request);
    }

    public Task<CampaniaCampoResponse> AccionarCampaniaAsync(long campoCampaniaId, string accion, string? motivo = null) =>
        _api.PostAsync<CampaniaCampoResponse>($"api/Paltos/CamposCampanias/Campania/{campoCampaniaId}/{accion}", new AccionCampaniaRequest
        {
            EmpresaId = EmpresaId,
            UsrSistema = UsrSistema,
            Motivo = motivo
        });

    public Task<CampaniaCampoResponse> ReimportarPresupuestoAsync(long campoCampaniaId, long fuenteId) =>
        _api.PostAsync<CampaniaCampoResponse>($"api/Paltos/CamposCampanias/Campania/{campoCampaniaId}/ReimportarPresupuesto", new ReimportarPresupuestoCampaniaRequest
        {
            EmpresaId = EmpresaId,
            UsrSistema = UsrSistema,
            CampoCampaniaFuenteId = fuenteId
        });

    public Task<ReconstruccionHistoricoResponse> GetPreviewReconstruccionAsync() =>
        _api.GetAsync<ReconstruccionHistoricoResponse>($"api/Paltos/CamposCampanias/Reconstruccion/Preview?empresaId={EmpresaId}");

    public Task<ReconstruccionHistoricoResponse> ReconstruirHistoricoAsync(List<string> codigosCampo, long? presupuestoReferenciaCampoCampaniaId) =>
        _api.PostAsync<ReconstruccionHistoricoResponse>("api/Paltos/CamposCampanias/Reconstruccion", new ReconstruirHistoricoRequest
        {
            CodigosCampo = codigosCampo,
            PresupuestoReferenciaCampoCampaniaId = presupuestoReferenciaCampoCampaniaId,
            EmpresaId = EmpresaId,
            UsrSistema = UsrSistema
        });

    public Task<PresupuestoFertilizacionResponse> GetPresupuestoAsync(long campoCampaniaId) =>
        _api.GetAsync<PresupuestoFertilizacionResponse>($"api/Paltos/PresupuestoFertilizacion/{campoCampaniaId}?empresaId={EmpresaId}");

    public Task<PresupuestoFertilizacionResponse> GuardarPresupuestoAsync(GuardarPresupuestoFertilizacionRequest request)
    {
        request.EmpresaId = EmpresaId;
        request.UsrSistema = UsrSistema;
        return _api.PutAsync<PresupuestoFertilizacionResponse>("api/Paltos/PresupuestoFertilizacion", request);
    }

    public Task<ControlFertilizacionResponse> GetControlAsync(long campoCampaniaId) =>
        _api.GetAsync<ControlFertilizacionResponse>($"api/Paltos/ControlFertilizacion/{campoCampaniaId}?empresaId={EmpresaId}");

    public Task<DetalleSalidasFertilizacionResponse> GetDetalleSalidasAsync(long campoCampaniaId, int? anio = null, int? mes = null)
    {
        var periodo = anio is > 0 && mes is > 0 ? $"&anio={anio}&mes={mes}" : string.Empty;
        return _api.GetAsync<DetalleSalidasFertilizacionResponse>($"api/Paltos/ControlFertilizacion/{campoCampaniaId}/Salidas?empresaId={EmpresaId}{periodo}");
    }

    public Task<ControlFertilizacionResponse> CerrarMesAsync(long campoCampaniaId, short anio, byte mes) =>
        _api.PostAsync<ControlFertilizacionResponse>($"api/Paltos/ControlFertilizacion/{campoCampaniaId}/CerrarMes", new CerrarMesFertilizacionRequest
        {
            EmpresaId = EmpresaId,
            UsrSistema = UsrSistema,
            Anio = anio,
            Mes = mes
        });

    public Task<ControlFertilizacionResponse> ReabrirMesAsync(long campoCampaniaId, short anio, byte mes, string motivo) =>
        _api.PostAsync<ControlFertilizacionResponse>($"api/Paltos/ControlFertilizacion/{campoCampaniaId}/ReabrirMes", new CerrarMesFertilizacionRequest
        {
            EmpresaId = EmpresaId,
            UsrSistema = UsrSistema,
            Anio = anio,
            Mes = mes,
            Motivo = motivo
        });
}
