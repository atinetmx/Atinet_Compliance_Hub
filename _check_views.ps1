param(
    [string]$Email    = "superadmin@atinet.com.mx",
    [string]$Password = "password",
    [string]$BaseUrl  = "http://192.168.1.1:8080"
)

$ErrorActionPreference = "Stop"

function Write-Ok  ($msg) { Write-Host "  [OK ]  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [302]  $msg" -ForegroundColor Yellow }
function Write-Err ($msg) { Write-Host "  [ERR]  $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "  [---]  $msg" -ForegroundColor Gray }

$routes = @(
    "/",
    "/dashboard",
    "/admin/notarias",
    "/admin/notarias/create",
    "/admin/plans",
    "/admin/plans/create",
    "/admin/services",
    "/admin/services/create",
    "/admin/subscriptions",
    "/admin/subscriptions/create",
    "/admin/users",
    "/admin/users/reports",
    "/admin/settings",
    "/admin/documentacion",
    "/admin/reports",
    "/admin/reports/service-usage",
    "/admin/reports/notarias-comparison",
    "/admin/reports/near-limit",
    "/admin/agenda",
    "/admin/registro-web",
    "/admin/registro-web/listado",
    "/admin/escaner-inteligente",
    "/admin/control-notarial",
    "/admin/control-notarial/expedientes",
    "/admin/control-notarial/expedientes/alta-expedientes",
    "/admin/control-notarial/expedientes/presupuesto-previo",
    "/admin/control-notarial/escrituras",
    "/admin/control-notarial/presupuestos",
    "/admin/control-notarial/recibos",
    "/admin/control-notarial/recibos/expediente",
    "/admin/control-notarial/reportes",
    "/admin/control-notarial/configuracion",
    "/admin/control-notarial/configuracion/notaria",
    "/admin/control-notarial/configuracion/formatos-ilimitados",
    "/admin/control-notarial/clientes",
    "/admin/control-notarial/configuracion-operaciones",
    "/admin/control-notarial/configuraciones-tarifarias",
    "/admin/control-notarial/usuarios",
    "/admin/control-notarial/alta-catalogos",
    "/admin/control-notarial/reporte-usuarios"
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CHECK VIEWS - $BaseUrl" -ForegroundColor Cyan
Write-Host "  Usuario: $Email" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[ 1/3 ] Obteniendo CSRF token..." -ForegroundColor Cyan

$session = $null

try {
    $loginPage = Invoke-WebRequest -Uri "$BaseUrl/login" `
        -SessionVariable session `
        -UseBasicParsing `
        -MaximumRedirection 5
    $session = Get-Variable -Name session -ValueOnly
} catch {
    Write-Host "ERROR: No se pudo acceder a $BaseUrl/login - $_" -ForegroundColor Red
    exit 1
}

$csrfMatch = [regex]::Match($loginPage.Content, '<meta name="csrf-token" content="([^"]+)"')
if (-not $csrfMatch.Success) {
    Write-Host "ERROR: No se encontro el CSRF token en la pagina de login." -ForegroundColor Red
    exit 1
}
$csrfToken = $csrfMatch.Groups[1].Value
Write-Ok "CSRF token obtenido: $($csrfToken.Substring(0,12))..."

Write-Host ""
Write-Host "[ 2/3 ] Autenticando como $Email..." -ForegroundColor Cyan

try {
    $loginResponse = Invoke-WebRequest -Uri "$BaseUrl/login" `
        -Method POST `
        -WebSession $session `
        -UseBasicParsing `
        -MaximumRedirection 10 `
        -Body @{
            email    = $Email
            password = $Password
            _token   = $csrfToken
        }

    if ($loginResponse.BaseResponse.RequestMessage.RequestUri.AbsolutePath -eq "/login") {
        Write-Err "Login fallido - verifica las credenciales (-Email, -Password)"
        exit 1
    }
    Write-Ok "Autenticado correctamente (sesion activa)"
} catch {
    Write-Err "Error en login: $_"
    exit 1
}

Write-Host ""
Write-Host "[ 3/3 ] Verificando vistas ($($routes.Count) rutas)..." -ForegroundColor Cyan
Write-Host ""

$ok       = 0
$warnings = 0
$errors   = 0
$results  = @()

foreach ($route in $routes) {
    $url = "$BaseUrl$route"
    try {
        $response = Invoke-WebRequest -Uri $url `
            -WebSession $session `
            -UseBasicParsing `
            -MaximumRedirection 10 `
            -ErrorAction SilentlyContinue
        $code = $response.StatusCode
        # Detectar redirect a login (sesion perdida o sin permiso)
        $finalUrl = $response.BaseResponse.ResponseUri.AbsolutePath
        if ($finalUrl -eq "/login") { $code = "401" }
        elseif ($finalUrl -notlike "*$($route.TrimStart('/'))*" -and $route -ne "/" -and $route -ne "/dashboard") {
            $code = "302->$finalUrl"
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "ERR" }
    }

    $padded = $route.PadRight(65)

    $codeStr = $code.ToString()
    if     ($codeStr -eq "200")           { Write-Ok   "$padded $code"; $ok++ }
    elseif ($codeStr -eq "401")           { Write-Err  "$padded $code  (redirige a login)"; $errors++ }
    elseif ($codeStr -like "302->*")      { Write-Warn "$padded $code  (sin permiso)"; $warnings++ }
    elseif ($codeStr -eq "302")           { Write-Warn "$padded $code  (redirect)"; $warnings++ }
    elseif ($codeStr -match "^4")         { Write-Err  "$padded $code"; $errors++ }
    elseif ($codeStr -match "^5")         { Write-Err  "$padded $code  <- SERVER ERROR"; $errors++ }
    else                                  { Write-Info "$padded $code"; $warnings++ }

    $results += [PSCustomObject]@{ Code = $code; Route = $route }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "  OK (200)   : $ok" -ForegroundColor Green
Write-Host "  Warnings   : $warnings" -ForegroundColor Yellow
Write-Host "  Errores    : $errors" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Cyan

if ($errors -gt 0) {
    Write-Host ""
    Write-Host "  RUTAS CON ERROR:" -ForegroundColor Red
    $results | Where-Object { $_.Code.ToString() -match "^[45]" } | ForEach-Object {
        Write-Host "    [$($_.Code)]  $($_.Route)" -ForegroundColor Red
    }
}

Write-Host ""