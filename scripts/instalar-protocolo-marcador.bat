@echo off
REM Script para registrar el protocolo custom "marcador://" en Windows
REM Ejecutar como Administrator

setlocal enabledelayedexpansion

REM Obtener la ruta de este script
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"

REM Definir la ruta del script PowerShell
set "PS_SCRIPT=%SCRIPT_DIR%\reemplazar-marcador.ps1"

REM Convertir a ruta con comillas escapadas
set "PS_SCRIPT_ESCAPED=%PS_SCRIPT:\=\\%"

echo.
echo Registrando protocolo custom "marcador://"...
echo.

REM Crear entrada para el protocolo
reg add "HKEY_CLASSES_ROOT\marcador" /ve /d "URL:Marcador Protocol" /f
if errorlevel 1 (
    echo Error: No se pudo crear la clave del protocolo. Ejecuta como Administrator.
    pause
    exit /b 1
)

REM Marcar como protocolo URL
reg add "HKEY_CLASSES_ROOT\marcador" /v "URL Protocol" /d "" /f

REM Crear comando para ejecutar el PowerShell script
reg add "HKEY_CLASSES_ROOT\marcador\shell\open\command" /ve /d "powershell -NoProfile -ExecutionPolicy Bypass -File \"%PS_SCRIPT%\" \"%%1\"" /f

echo.
echo ✓ Protocolo registrado correctamente
echo.
echo Script PowerShell: %PS_SCRIPT%
echo.
echo Ya puedes usar links como: marcador://{{c_alias_COMPRADOR_1}}
echo.
pause
