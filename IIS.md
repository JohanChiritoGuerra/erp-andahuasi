# IIS y WebDeploy — ERP Andahuasi (Razor Pages)

El sitio es un `Sdk.Web` de .NET 10. Se publica desde Visual Studio con el perfil `IIS-WebDeploy` (`Properties/PublishProfiles/IIS-WebDeploy.pubxml`).

## Servidor IIS

1. Instalar **ASP.NET Core 10.0 Hosting Bundle**.
2. Crear el sitio (por ejemplo `erp.andahuasi.com`) apuntando a la carpeta de publicación.
3. Application Pool:
   - .NET CLR version: **No Managed Code**
   - Identity con permiso de lectura sobre el sitio y de escritura si usa `FotosTrabajadores:Path`.
4. HTTPS con certificado válido. En producción la cookie se llama `__Secure-erp.session` y exige HTTPS.
5. Variables de entorno del Application Pool o `appsettings.Production.json` (no commitear secretos):

```text
Auth__BaseUrl=https://auth.andahuasi.com
Auth__BffClientSecret=<mismo valor que InternalClients:Erp:Secret en Auth>
ErpApi__BaseUrl=https://api.andahuasi.com
Tenants__ByHost__erp.andahuasi.com=02
Tenants__ByHost__erp.sannicolasdetolentino.com=05
Tenants__ByHost__erp.andahuasikm415.com=06
```

`Auth__BffClientSecret` es obligatorio en producción. Si Auth no reconoce el secreto, el login funciona unos 15 minutos y luego falla el refresh.

## Visual Studio (WebDeploy)

1. Abrir `ErpAndahuasi.sln`.
2. Clic derecho en el proyecto → **Publish**.
3. Elegir **IIS, FTP, etc.** → **Web Deploy**.
4. Completar servidor, sitio (`erp-andahuasi`) y credenciales WMSVC.
5. Publish.

El perfil de ejemplo está en `Properties/PublishProfiles/IIS-WebDeploy.pubxml`. Ajuste `MSDeployServiceURL` y `DeployIisAppPath`. No guarde la contraseña en el archivo.

## Assets Materio

Los `.dist.css` / `.dist.js` ya están en `wwwroot`. No hace falta Node/Gulp en el servidor. Si modifica SCSS, compile en desarrollo con `yarn build` antes de publicar.

## CORS

Si este sitio reemplaza `erp.andahuasi.com`, la API no requiere cambios. Si usa otro origen, agréguelo a `Cors:AllowedOrigins` de `api-andahuasi-pe`.
