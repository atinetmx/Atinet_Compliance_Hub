param([string]$Uri)

$logFile = "$env:TEMP\marcador-replace.log"

# Log inicial
Add-Content -Path $logFile -Value "$(Get-Date): === INICIO ===" -Force

try {
    # Extraer el marcador de la URL (marcador://{{c_alias_COMPRADOR_1}})
    $marcador = $Uri -replace '^marcador://', ''

    # Decodificar si viene con encoding
    $marcador = [System.Uri]::UnescapeDataString($marcador)

    Add-Content -Path $logFile -Value "$(Get-Date): Marcador extraído: $marcador"

    # Intentar conectar con Word abierto
    try {
        Add-Content -Path $logFile -Value "$(Get-Date): Intentando conectar con Word COM..."
        $word = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')

        Add-Content -Path $logFile -Value "$(Get-Date): Word encontrado"

        # Obtener la selección actual
        $selection = $word.Selection

        # Reemplazar el texto seleccionado con el marcador
        $selection.Text = $marcador

        # Traer Word al frente
        $word.Activate()

        Add-Content -Path $logFile -Value "$(Get-Date): ✓ Marcador insertado exitosamente"
    }
    catch {
        Add-Content -Path $logFile -Value "$(Get-Date): Word no está abierto o error: $_"

        # Fallback: copiar al clipboard
        Add-Content -Path $logFile -Value "$(Get-Date): Usando fallback: clipboard"
        $marcador | Set-Clipboard
        Add-Content -Path $logFile -Value "$(Get-Date): ✓ Copiado al clipboard"
    }
}
catch {
    Add-Content -Path $logFile -Value "$(Get-Date): ❌ ERROR CRÍTICO: $_"
}

Add-Content -Path $logFile -Value "$(Get-Date): === FIN ==="
