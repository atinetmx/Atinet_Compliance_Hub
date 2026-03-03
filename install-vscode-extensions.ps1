#!/usr/bin/env pwsh
# Script para instalar extensiones de VS Code para desarrollo Laravel
# Ejecutar en PowerShell: .\install-vscode-extensions.ps1

Write-Host "🚀 Instalando extensiones de VS Code para desarrollo Laravel..." -ForegroundColor Cyan
Write-Host ""

# Lista de extensiones esenciales
$extensions = @(
    # PHP & Laravel
    "bmewburn.vscode-intelephense-client",           # Intelephense - PHP IntelliSense
    "xdebug.php-debug",                              # PHP Debug
    "zobo.php-intellisense",                         # PHP IntelliSense
    "neilbrayfield.php-docblocker",                  # PHP DocBlocker
    "onecentlin.laravel-blade",                      # Laravel Blade Snippets
    "amiralizadeh9480.laravel-extra-intellisense",   # Laravel Extra Intellisense
    "ryannaddy.laravel-artisan",                     # Laravel Artisan
    "codingyu.laravel-goto-view",                    # Laravel Goto View
    "onecentlin.laravel5-snippets",                  # Laravel Snippets

    # JavaScript/TypeScript/React
    "dbaeumer.vscode-eslint",                        # ESLint
    "esbenp.prettier-vscode",                        # Prettier
    "dsznajder.es7-react-js-snippets",              # ES7+ React/Redux/React-Native snippets
    "formulahendry.auto-rename-tag",                 # Auto Rename Tag
    "formulahendry.auto-close-tag",                  # Auto Close Tag
    "styled-components.vscode-styled-components",    # vscode-styled-components

    # Inertia.js
    "austenc.laravel-blade-spacer",                  # Blade Spacer (útil con Inertia)

    # Tailwind CSS
    "bradlc.vscode-tailwindcss",                     # Tailwind CSS IntelliSense

    # Testing (Pest/PHPUnit)
    "recca0120.vscode-phpunit",                      # PHPUnit Test Explorer
    "m1guelpf.better-pest",                          # Better Pest

    # Git
    "eamodio.gitlens",                               # GitLens
    "mhutchie.git-graph",                            # Git Graph
    "donjayamanne.githistory",                       # Git History
    "github.vscode-pull-request-github",             # GitHub Pull Requests

    # Database
    "mysql.mysql-shell",                             # MySQL Shell for VS Code
    "mtxr.sqltools",                                 # SQLTools

    # Utilidades generales
    "editorconfig.editorconfig",                     # EditorConfig
    "mikestead.dotenv",                              # DotENV
    "christian-kohler.path-intellisense",            # Path Intellisense
    "visualstudioexptteam.vscodeintellicode",        # IntelliCode
    "gruntfuggly.todo-tree",                         # Todo Tree
    "wayou.vscode-todo-highlight",                   # TODO Highlight
    "aaron-bond.better-comments",                    # Better Comments
    "usernamehw.errorlens",                          # Error Lens

    # Markdown
    "yzhang.markdown-all-in-one",                    # Markdown All in One
    "davidanson.vscode-markdownlint",                # markdownlint

    # Formato y calidad de código
    "streetsidesoftware.code-spell-checker",         # Code Spell Checker
    "streetsidesoftware.code-spell-checker-spanish", # Spanish - Code Spell Checker

    # Docker (si usas Sail)
    "ms-azuretools.vscode-docker",                   # Docker
)

# Contador
$total = $extensions.Count
$current = 0
$installed = 0
$skipped = 0
$failed = 0

foreach ($extension in $extensions) {
    $current++
    Write-Host "[$current/$total] Instalando: $extension" -ForegroundColor Yellow

    try {
        $output = code --install-extension $extension 2>&1

        if ($LASTEXITCODE -eq 0) {
            if ($output -like "*is already installed*") {
                Write-Host "  ✓ Ya instalada" -ForegroundColor Gray
                $skipped++
            } else {
                Write-Host "  ✓ Instalada correctamente" -ForegroundColor Green
                $installed++
            }
        } else {
            Write-Host "  ✗ Error al instalar" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        $failed++
    }

    Write-Host ""
}

# Resumen
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE INSTALACIÓN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Total de extensiones: $total" -ForegroundColor White
Write-Host "✓ Nuevas instaladas:  $installed" -ForegroundColor Green
Write-Host "⊙ Ya instaladas:      $skipped" -ForegroundColor Gray
Write-Host "✗ Fallidas:           $failed" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if ($failed -gt 0) {
    Write-Host "⚠️  Algunas extensiones fallaron. Verifica que VS Code esté instalado y en el PATH." -ForegroundColor Yellow
} else {
    Write-Host "🎉 ¡Todas las extensiones se procesaron correctamente!" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 Puede que necesites reiniciar VS Code para que algunas extensiones funcionen correctamente." -ForegroundColor Cyan
