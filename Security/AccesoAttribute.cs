using ErpAndahuasi.Auth;
using ErpAndahuasi.Menu;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ErpAndahuasi.Security;

[AttributeUsage(AttributeTargets.Class)]
public sealed class AccesoAttribute : Attribute
{
    public string AccUrl { get; }

    public AccesoAttribute(string accUrl)
    {
        AccUrl = accUrl;
    }
}

public class ErpPageFilter : IAsyncPageFilter
{
    public Task OnPageHandlerSelectionAsync(PageHandlerSelectedContext context) => Task.CompletedTask;

    public async Task OnPageHandlerExecutionAsync(PageHandlerExecutingContext context, PageHandlerExecutionDelegate next)
    {
        var anonymous = context.ActionDescriptor.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any();
        if (anonymous)
        {
            await next();
            return;
        }

        var http = context.HttpContext;
        var user = http.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new RedirectToPageResult("/Auth/Login", new { redirectTo = http.Request.Path + http.Request.QueryString });
            return;
        }

        var session = http.RequestServices.GetRequiredService<IErpSessionAccessor>();
        if (!session.RememberMe && session.SessionExpiresAt is { } expires && expires <= DateTimeOffset.UtcNow)
        {
            await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            context.Result = new RedirectToPageResult("/Auth/Login", new { expired = true });
            return;
        }

        var acceso = context.HandlerInstance?.GetType()
            .GetCustomAttributes(typeof(AccesoAttribute), true)
            .OfType<AccesoAttribute>()
            .FirstOrDefault();

        if (acceso is not null)
        {
            var menu = http.RequestServices.GetRequiredService<IMenuProvider>();
            if (!await menu.CanAccessAsync(acceso.AccUrl))
            {
                context.Result = new RedirectToPageResult("/Error", new { code = 401 });
                return;
            }
        }

        await next();
    }
}

public class SessionExpiredExceptionFilter : IAsyncExceptionFilter
{
    public async Task OnExceptionAsync(ExceptionContext context)
    {
        if (context.Exception is not Api.ErpApiException { StatusCode: 401 })
            return;

        await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        context.Result = new RedirectToPageResult("/Auth/Login", new { expired = true });
        context.ExceptionHandled = true;
    }
}
