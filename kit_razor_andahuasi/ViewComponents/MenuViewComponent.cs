using Andahuasi.Models;
using Andahuasi.Services;
using Microsoft.AspNetCore.Mvc;

namespace Andahuasi.ViewComponents;

// Se invoca desde _Layout: @await Component.InvokeAsync("Menu")
public class MenuViewComponent : ViewComponent
{
    private readonly IShellService _shell;
    public MenuViewComponent(IShellService shell) => _shell = shell;

    public async Task<IViewComponentResult> InvokeAsync()
    {
        var modulos = await _shell.GetMenuAsync(UserClaimsPrincipal);
        return View(new MenuViewModel
        {
            Modulos = modulos,
            RutaActual = HttpContext.Request.Path.Value ?? "/"
        });
    }
}
