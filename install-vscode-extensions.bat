@echo off
REM Script para instalar extensiones de VS Code para desarrollo Laravel
REM Ejecutar: install-vscode-extensions.bat

echo.
echo ========================================
echo  Instalando extensiones de VS Code
echo ========================================
echo.

REM PHP y Laravel
call :install "bmewburn.vscode-intelephense-client"
call :install "xdebug.php-debug"
call :install "neilbrayfield.php-docblocker"
call :install "onecentlin.laravel-blade"
call :install "amiralizadeh9480.laravel-extra-intellisense"
call :install "ryannaddy.laravel-artisan"
call :install "codingyu.laravel-goto-view"
call :install "onecentlin.laravel5-snippets"

REM JavaScript/TypeScript/React
call :install "dbaeumer.vscode-eslint"
call :install "esbenp.prettier-vscode"
call :install "dsznajder.es7-react-js-snippets"
call :install "formulahendry.auto-rename-tag"
call :install "formulahendry.auto-close-tag"

REM Tailwind CSS
call :install "bradlc.vscode-tailwindcss"

REM Testing
call :install "recca0120.vscode-phpunit"
call :install "m1guelpf.better-pest"

REM Git
call :install "eamodio.gitlens"
call :install "mhutchie.git-graph"
call :install "donjayamanne.githistory"
call :install "github.vscode-pull-request-github"

REM Database
call :install "mtxr.sqltools"

REM Utilidades
call :install "editorconfig.editorconfig"
call :install "mikestead.dotenv"
call :install "christian-kohler.path-intellisense"
call :install "visualstudioexptteam.vscodeintellicode"
call :install "gruntfuggly.todo-tree"
call :install "aaron-bond.better-comments"
call :install "usernamehw.errorlens"

REM Markdown
call :install "yzhang.markdown-all-in-one"

REM Calidad de código
call :install "streetsidesoftware.code-spell-checker"
call :install "streetsidesoftware.code-spell-checker-spanish"

REM Docker
call :install "ms-azuretools.vscode-docker"

echo.
echo ========================================
echo  Instalacion completada!
echo ========================================
echo.
echo Reinicia VS Code para aplicar los cambios.
echo.
pause
exit /b 0

:install
echo Instalando: %~1
code --install-extension %~1
echo.
exit /b 0
