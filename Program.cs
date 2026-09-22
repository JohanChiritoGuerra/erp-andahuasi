using System.Globalization;
using ErpAndahuasi.Api;
using Microsoft.AspNetCore.Authentication;
using ErpAndahuasi.Auth;
using ErpAndahuasi.Menu;
using ErpAndahuasi.Options;
using ErpAndahuasi.Security;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Localization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.Configure<ErpApiOptions>(builder.Configuration.GetSection(ErpApiOptions.SectionName));
builder.Services.Configure<TenantOptions>(builder.Configuration.GetSection(TenantOptions.SectionName));
builder.Services.Configure<FotosOptions>(builder.Configuration.GetSection(FotosOptions.SectionName));

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.All;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
    options.ForwardLimit = null;
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<ITenantResolver, TenantResolver>();
builder.Services.AddScoped<IAuthClient, AuthClient>();
builder.Services.AddScoped<IErpSessionAccessor, ErpSessionAccessor>();
builder.Services.AddScoped<IErpSignInService, ErpSignInService>();
builder.Services.AddScoped<ErpApiClient>();
builder.Services.AddScoped<SistemaApi>();
builder.Services.AddScoped<RrhhApi>();
builder.Services.AddScoped<PaltosApi>();
builder.Services.AddScoped<IMenuProvider, MenuProvider>();

var isDevelopment = builder.Environment.IsDevelopment();

builder.Services.AddHttpClient("Auth", (sp, client) =>
{
    var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AuthOptions>>().Value;
    client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(20);
}).ConfigurePrimaryHttpMessageHandler(() => CreateHandler(isDevelopment));

builder.Services.AddHttpClient("ErpApi", (sp, client) =>
{
    var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<ErpApiOptions>>().Value;
    client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(60);
}).ConfigurePrimaryHttpMessageHandler(() => CreateHandler(isDevelopment));

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.LogoutPath = "/logout";
        options.AccessDeniedPath = "/Error";
        options.SlidingExpiration = false;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.Cookie.Name = builder.Environment.IsProduction() ? "__Secure-erp.session" : "erp.session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = builder.Environment.IsProduction()
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.Redirect($"/login?redirectTo={Uri.EscapeDataString(context.Request.Path + context.Request.QueryString)}");
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/");
    options.Conventions.AllowAnonymousToPage("/Auth/Login");
    options.Conventions.AllowAnonymousToPage("/Error");
}).AddMvcOptions(options =>
{
    options.Filters.Add<ErpPageFilter>();
    options.Filters.Add<SessionExpiredExceptionFilter>();
});

var app = builder.Build();

var culture = new CultureInfo("es-PE");
CultureInfo.DefaultThreadCurrentCulture = culture;
CultureInfo.DefaultThreadCurrentUICulture = culture;
app.UseRequestLocalization(new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture(culture),
    SupportedCultures = [culture],
    SupportedUICultures = [culture]
});

app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.Use(async (context, next) =>
{
    var result = await context.AuthenticateAsync();
    if (result.Properties is not null)
        context.Items["ErpAuthProperties"] = result.Properties;
    await next();
});
app.UseAuthorization();
app.MapRazorPages();
app.Run();

static HttpMessageHandler CreateHandler(bool development)
{
    var handler = new HttpClientHandler();
    if (development)
        handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;

    return handler;
}
