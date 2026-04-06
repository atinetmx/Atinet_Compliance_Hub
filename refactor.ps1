$files = @(
    "resources/js/pages/ControlNotarial/Configuracion/AltaCatalogos/Index.tsx",
    "resources/js/pages/ControlNotarial/Configuracion/Clientes/Index.tsx",
    "resources/js/pages/ControlNotarial/Configuracion/Notaria/Index.tsx",
    "resources/js/pages/ControlNotarial/Configuracion/ReporteUsuarios/Index.tsx",
    "resources/js/pages/ControlNotarial/Configuracion/Usuarios/Index.tsx",
    "resources/js/pages/ControlNotarial/ConfiguracionOperaciones/Index.tsx"
)

$modifiedCount = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        # Add const api = useApi() if not present
        if ($content -notmatch "const api = useApi\(\)") {
            $content = $content -replace '(const \{ addToast \} = useToast\(\);)', "$1
const api = useApi();"
        }
        
        # Replace fetch calls
        $content = $content -replace "fetch\('https://localhost:44327/api/", "await api.get('"
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file -Value $content
            $modifiedCount++
        }
    }
}

Write-Output "Archivos modificados: $modifiedCount"
