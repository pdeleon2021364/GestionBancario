# Detiene cualquier instancia previa de AuthService.Api y arranca el servicio.
# Ejecuta este script desde la carpeta auth-service.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$projectPath = "src\AuthService.Api\AuthService.Api.csproj"
$serviceName = "AuthService.Api"
$port = 5917

Write-Host "[AuthService] Ubicación actual: $scriptDir"
Write-Host "[AuthService] Proyecto: $projectPath"

Write-Host "[AuthService] Buscando procesos existentes..."
$running = Get-Process -Name $serviceName -ErrorAction SilentlyContinue
if ($running) {
    foreach ($proc in $running) {
        Write-Host "[AuthService] Deteniendo PID $($proc.Id) ($($proc.Path))"
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}
else {
    Write-Host "[AuthService] No se encontraron procesos $serviceName en ejecución."
}

Write-Host "[AuthService] Verificando puerto $port..."
$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        Write-Host "[AuthService] Puerto $port ocupado por PID $($conn.OwningProcess)"
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

if (-Not (Test-Path $projectPath)) {
    Write-Error "No se encontró el proyecto: $projectPath"
    exit 1
}

Write-Host "[AuthService] Construyendo proyecto..."
$build = dotnet build $projectPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "La compilación falló. Corrige los errores y vuelve a ejecutar este script."
    exit $LASTEXITCODE
}

Write-Host "[AuthService] Ejecutando AuthService.Api..."
dotnet run --project $projectPath
