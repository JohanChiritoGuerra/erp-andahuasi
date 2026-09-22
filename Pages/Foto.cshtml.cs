using ErpAndahuasi.Auth;
using ErpAndahuasi.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Options;

namespace ErpAndahuasi.Pages;

public class FotoModel : PageModel
{
    private readonly IAuthClient _auth;
    private readonly IErpSessionAccessor _session;
    private readonly FotosOptions _fotos;

    public FotoModel(IAuthClient auth, IErpSessionAccessor session, IOptions<FotosOptions> fotos)
    {
        _auth = auth;
        _session = session;
        _fotos = fotos.Value;
    }

    public async Task<IActionResult> OnGetAsync(string trabId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(trabId) || !trabId.All(char.IsDigit))
            return BadRequest();

        if (!string.Equals(_session.Current.TrabId, trabId, StringComparison.Ordinal))
            return NotFound();

        if (!string.IsNullOrWhiteSpace(_fotos.Path) && Directory.Exists(_fotos.Path))
        {
            var padded = trabId.PadLeft(5, '0');
            foreach (var name in new[] { $"{trabId}.jpg", $"{padded}.jpg", $"{trabId}.png", $"{padded}.png" })
            {
                var file = Path.Combine(_fotos.Path, name);
                if (System.IO.File.Exists(file))
                    return PhysicalFile(file, name.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ? "image/png" : "image/jpeg");
            }
        }

        var token = _session.AccessToken;
        if (string.IsNullOrWhiteSpace(token))
            return NotFound();

        var bytes = await _auth.GetFotoAsync(token, ct);
        if (bytes is null || bytes.Length == 0)
            return NotFound();

        var contentType = bytes.Length >= 8 && bytes[0] == 0x89 ? "image/png" : "image/jpeg";
        return File(bytes, contentType);
    }
}
