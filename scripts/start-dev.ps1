# Arranca API (7255) y ERP (7091). Uso: pwsh ./scripts/start-dev.ps1
$ErrorActionPreference = "Stop"
$apiProj = "C:\Users\johanchg\Repositories\api-andahuasi-pe\src\SigerpApi\SigerpApi.csproj"
$erpProj = Join-Path $PSScriptRoot "..\ErpAndahuasi.csproj"

function Test-Port([int]$Port) {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $c.Connect("127.0.0.1", $Port)
    $c.Close()
    return $true
  } catch { return $false }
}

Write-Host "API → https://localhost:7255"
if (-not (Test-Port 7255)) {
  Start-Process pwsh -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location 'C:\Users\johanchg\Repositories\api-andahuasi-pe\src\SigerpApi'; dotnet run --launch-profile https"
  )
} else {
  Write-Host "  (ya escuchaba en 7255)"
}

Write-Host "ERP → https://localhost:7091"
if (-not (Test-Port 7091)) {
  Start-Process pwsh -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$(Split-Path $erpProj -Parent)'; dotnet run --project '$erpProj' --urls https://localhost:7091"
  )
} else {
  Write-Host "  (ya escuchaba en 7091)"
}

Write-Host "Listo."
