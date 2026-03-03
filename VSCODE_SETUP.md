# Instalación de Extensiones VS Code para Laravel

Este script instala automáticamente todas las extensiones necesarias para el desarrollo Laravel con este proyecto.

## 🚀 Uso Rápido

Ejecuta el script en PowerShell desde la raíz del proyecto:

```powershell
.\install-vscode-extensions.ps1
```

## 📦 Extensiones Incluidas

### PHP & Laravel
- **Intelephense** - IntelliSense avanzado para PHP
- **PHP Debug** - Depuración con Xdebug
- **PHP DocBlocker** - Generación automática de DocBlocks
- **Laravel Blade** - Sintaxis y snippets para Blade
- **Laravel Extra Intellisense** - Autocompletado para Laravel
- **Laravel Artisan** - Comandos Artisan desde VS Code
- **Laravel Goto View** - Navegación rápida a vistas
- **Laravel Snippets** - Snippets útiles para Laravel

### JavaScript/TypeScript/React
- **ESLint** - Linting de JavaScript/TypeScript
- **Prettier** - Formateo de código
- **ES7+ React Snippets** - Snippets para React
- **Auto Rename Tag** - Renombrado automático de etiquetas HTML/JSX
- **Auto Close Tag** - Cierre automático de etiquetas

### Tailwind CSS
- **Tailwind CSS IntelliSense** - Autocompletado y preview de clases Tailwind

### Testing (Pest/PHPUnit)
- **PHPUnit Test Explorer** - Ejecuta tests desde VS Code
- **Better Pest** - Soporte mejorado para Pest

### Git
- **GitLens** - Superpoderes para Git
- **Git Graph** - Visualización del historial de Git
- **Git History** - Ver historial de archivos
- **GitHub Pull Requests** - Gestión de PRs desde VS Code

### Base de Datos
- **MySQL Shell** - Interfaz para MySQL
- **SQLTools** - Gestión de bases de datos

### Utilidades
- **EditorConfig** - Soporte para .editorconfig
- **DotENV** - Sintaxis para archivos .env
- **Path Intellisense** - Autocompletado de rutas
- **IntelliCode** - IA para sugerencias de código
- **Todo Tree** - Visualiza TODOs en el código
- **Better Comments** - Comentarios mejorados con colores
- **Error Lens** - Muestra errores inline

### Markdown
- **Markdown All in One** - Herramientas completas para Markdown
- **markdownlint** - Linting para Markdown

### Calidad de Código
- **Code Spell Checker** - Corrector ortográfico en inglés
- **Spanish Spell Checker** - Corrector ortográfico en español

### Docker (Laravel Sail)
- **Docker** - Soporte para contenedores Docker

## 📋 Requisitos

- VS Code instalado
- Comando `code` disponible en el PATH

Para agregar `code` al PATH en Windows:
1. Abre VS Code
2. Presiona `Ctrl+Shift+P`
3. Busca "Shell Command: Install 'code' command in PATH"
4. Selecciona la opción

## ⚙️ Configuración Automática

El proyecto incluye:
- `.vscode/extensions.json` - VS Code sugerirá instalar estas extensiones automáticamente
- `.vscode/settings.json` - Configuraciones optimizadas para el proyecto

## 🔄 Actualización de Extensiones

Para actualizar todas las extensiones instaladas:

```powershell
code --update-extensions
```

## 🆘 Solución de Problemas

### El comando 'code' no se reconoce
Asegúrate de que VS Code esté instalado y agregado al PATH del sistema.

### Algunas extensiones fallan al instalar
- Verifica tu conexión a internet
- Intenta instalar manualmente las extensiones que fallaron desde el Marketplace de VS Code
- Reinicia VS Code e intenta nuevamente

### VS Code no muestra las sugerencias de extensiones
- Abre la paleta de comandos (`Ctrl+Shift+P`)
- Busca "Extensions: Show Recommended Extensions"
- Haz clic en "Install All"

## 📝 Personalización

Puedes agregar o quitar extensiones editando el archivo `install-vscode-extensions.ps1` y modificando el array `$extensions`.

Para agregar extensiones al archivo de recomendaciones del proyecto, edita `.vscode/extensions.json`.

## 🔗 Recursos Útiles

- [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode)
- [Intelephense Documentation](https://intelephense.com/)
- [GitLens Documentation](https://gitlens.amod.io/)
- [Tailwind CSS IntelliSense](https://github.com/tailwindlabs/tailwindcss-intellisense)
