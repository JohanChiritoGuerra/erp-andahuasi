using System.Text.Json;
using System.Text.Json.Serialization;

namespace ErpAndahuasi.Models;

/// <summary>
/// Respuesta del organigrama. La página solo la reenvía al navegador, así que el resto de
/// campos (unidades, conteos, personas…) se guardan tal cual en <see cref="Datos"/> en vez
/// de copiar aquí cada DTO de la API.
/// </summary>
public class OrganigramaResponse : IBaseResponse
{
    public BaseResponse BaseResponse { get; set; } = new();

    [JsonExtensionData]
    public Dictionary<string, JsonElement> Datos { get; set; } = [];
}
