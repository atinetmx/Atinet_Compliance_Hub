<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

echo "=== COMPARACIÓN: TABLA USUARIO vs CATÁLOGO LEGACY ===\n\n";

// 1. Obtener notarías desde tabla usuario (excluyendo 'atinet')
echo "1️⃣ Consultando tabla usuario (notarías registradas)...\n";

$notariasUsuario = DB::connection('aplicativos')
    ->table('usuario')
    ->where('notaria', '!=', 'atinet')
    ->whereNotNull('notaria')
    ->where('notaria', '!=', '')
    ->select('notaria', 'USER', 'NOMBRE', 'APELLIDO', 'FECHA')
    ->orderBy('notaria')
    ->get();

$notariasUsuarioUnicas = $notariasUsuario->pluck('notaria')->unique()->values();

echo "   ✅ Total notarías en usuario: ".$notariasUsuarioUnicas->count()."\n";
echo "   📊 Total registros usuario: ".$notariasUsuario->count()."\n";

echo "\n";

// 2. Obtener notarías desde catálogo legacy
echo "2️⃣ Consultando catálogo legacy (notarías con búsquedas)...\n";

$filename = 'catalogo_notarias_legacy.json';
if (! Storage::disk('local')->exists($filename)) {
    echo "   ❌ ERROR: Catálogo no existe. Ejecuta: php artisan catalog:generate-notarias\n";
    exit(1);
}

$json = Storage::disk('local')->get($filename);
$catalog = json_decode($json, true);
$notariasCatalogo = collect($catalog['notarias'])->pluck('notaria_id');

echo "   ✅ Total notarías en catálogo: ".$notariasCatalogo->count()."\n";

echo "\n";

// 3. Identificar discrepancias
echo "3️⃣ ANÁLISIS DE DISCREPANCIAS:\n\n";

// Convertir a minúsculas para comparación case-insensitive
$notariasUsuarioLower = $notariasUsuarioUnicas->map(fn ($n) => strtolower($n));
$notariasCatalogoLower = $notariasCatalogo->map(fn ($n) => strtolower($n));

// A) Notarías en usuario pero NO en catálogo (sin búsquedas)
$notariasSinBusquedasLower = $notariasUsuarioLower->diff($notariasCatalogoLower)->values();

// Obtener los IDs originales
$notariasSinBusquedas = $notariasUsuarioUnicas->filter(function ($notaria) use ($notariasSinBusquedasLower) {
    return $notariasSinBusquedasLower->contains(strtolower($notaria));
})->values();

echo "📌 Notarías EN usuario pero SIN búsquedas (no en catálogo): ".$notariasSinBusquedas->count()."\n";

if ($notariasSinBusquedas->count() > 0) {
    echo "\n   Listado de notarías sin búsquedas:\n";
    echo "   ".str_repeat('-', 80)."\n";
    
    foreach ($notariasSinBusquedas->sort() as $notariaId) {
        // Obtener información de esta notaría desde usuario
        $usuarios = $notariasUsuario->where('notaria', $notariaId);
        $totalUsuarios = $usuarios->count();
        $primerRegistro = $usuarios->sortBy('FECHA')->first();
        
        echo "   • {$notariaId}\n";
        echo "     └─ Usuarios registrados: {$totalUsuarios}\n";
        echo "     └─ Primer registro: ".$primerRegistro->FECHA."\n";
        echo "     └─ Usuario ejemplo: ".$primerRegistro->USER." ({$primerRegistro->NOMBRE} {$primerRegistro->APELLIDO})\n";
        echo "\n";
    }
}

echo "\n";

// B) Notarías en catálogo pero NO en usuario (solo búsquedas desktop/API)
$notariasSoloDesktopLower = $notariasCatalogoLower->diff($notariasUsuarioLower)->values();

// Obtener los IDs originales del catálogo
$notariasSoloDesktop = $notariasCatalogo->filter(function ($notaria) use ($notariasSoloDesktopLower) {
    return $notariasSoloDesktopLower->contains(strtolower($notaria));
})->values();

echo "📌 Notarías CON búsquedas pero SIN usuario web (solo Desktop/API): ".$notariasSoloDesktop->count()."\n";

if ($notariasSoloDesktop->count() > 0) {
    echo "\n   Listado (primeras 15):\n";
    echo "   ".str_repeat('-', 80)."\n";
    
    $catalogoArray = collect($catalog['notarias'])->keyBy('notaria_id');
    
    foreach ($notariasSoloDesktop->take(15) as $notariaId) {
        $notaria = $catalogoArray->get($notariaId);
        $estado = $notaria['es_activa'] ? '🟢' : '🔴';
        
        echo "   {$estado} {$notariaId}\n";
        echo "     └─ Búsquedas: ".number_format($notaria['total_busquedas'])."\n";
        echo "     └─ Fuentes: ".implode(', ', $notaria['fuentes'])."\n";
        echo "     └─ Última: ".$notaria['ultima_busqueda']."\n";
        echo "\n";
    }
    
    if ($notariasSoloDesktop->count() > 15) {
        echo "   ... y ".($notariasSoloDesktop->count() - 15)." más\n\n";
    }
}

echo "\n";

// C) Notarías en ambos (tienen usuario Y búsquedas)
$notariasEnAmbosLower = $notariasUsuarioLower->intersect($notariasCatalogoLower)->values();
$notariasEnAmbos = $notariasUsuarioUnicas->filter(function ($notaria) use ($notariasEnAmbosLower) {
    return $notariasEnAmbosLower->contains(strtolower($notaria));
})->values();

echo "📌 Notarías EN ambos sistemas (usuario + búsquedas): ".$notariasEnAmbos->count()."\n";
echo "   (Estas son las que tienen acceso web Y han realizado búsquedas)\n";
echo "   ⚠️  Nota: Comparación case-insensitive (71monterrey = 71Monterrey)\n";

echo "\n";

// 4. Verificación detallada de notarías sin búsquedas
echo "4️⃣ VERIFICACIÓN DETALLADA: ¿Por qué no tienen búsquedas?\n\n";

if ($notariasSinBusquedas->count() > 0) {
    echo "   Verificando en cada tabla de búsquedas...\n\n";
    
    foreach ($notariasSinBusquedas->take(5) as $notariaId) {
        echo "   🔍 {$notariaId}:\n";
        
        // Buscar en cada tabla
        $busquedasWeb = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('NOTARIA', $notariaId)
            ->count();
        
        $busquedasDesktop = DB::connection('aplicativos')
            ->table('busquedas_escritorio')
            ->where('NOTARIA', $notariaId)
            ->count();
        
        $busquedasOfac = DB::connection('aplicativos')
            ->table('atinet65_listasofac.consultas')
            ->where('proyecto', $notariaId)
            ->count();
        
        $busquedasSat = DB::connection('aplicativos')
            ->table('atinet65_listassat.consultas')
            ->where('proyecto', $notariaId)
            ->count();
        
        $total = $busquedasWeb + $busquedasDesktop + $busquedasOfac + $busquedasSat;
        
        echo "     • Web: {$busquedasWeb}\n";
        echo "     • Desktop: {$busquedasDesktop}\n";
        echo "     • OFAC: {$busquedasOfac}\n";
        echo "     • SAT: {$busquedasSat}\n";
        echo "     Total: {$total}\n";
        
        if ($total === 0) {
            echo "     ✅ Confirmado: NO tiene búsquedas en ninguna tabla\n";
        } else {
            echo "     ⚠️  RARO: Sí tiene búsquedas pero no está en catálogo\n";
        }
        
        echo "\n";
    }
}

echo "\n";

// 5. Resumen final
echo "=== RESUMEN FINAL ===\n\n";

echo "Total notarías en usuario:           ".str_pad($notariasUsuarioUnicas->count(), 4, ' ', STR_PAD_LEFT)."\n";
echo "Total notarías en catálogo:          ".str_pad($notariasCatalogo->count(), 4, ' ', STR_PAD_LEFT)."\n";
echo str_repeat('-', 45)."\n";
echo "Notarías en ambos:                   ".str_pad($notariasEnAmbos->count(), 4, ' ', STR_PAD_LEFT)."\n";
echo "Solo en usuario (sin búsquedas):     ".str_pad($notariasSinBusquedas->count(), 4, ' ', STR_PAD_LEFT)." ⚠️\n";
echo "Solo en catálogo (sin usuario web):  ".str_pad($notariasSoloDesktop->count(), 4, ' ', STR_PAD_LEFT)." ℹ️\n";

echo "\n";

// 6. Recomendaciones
echo "📝 RECOMENDACIONES:\n\n";

if ($notariasSinBusquedas->count() > 0) {
    echo "1. Las {$notariasSinBusquedas->count()} notarías sin búsquedas probablemente:\n";
    echo "   - Se registraron pero nunca usaron el sistema\n";
    echo "   - Son cuentas de prueba o demo\n";
    echo "   - Fueron dadas de baja antes de usar servicios\n";
    echo "\n";
    echo "2. ¿Incluirlas en el catálogo?\n";
    echo "   SI: Si quieres lista completa de notarías registradas\n";
    echo "   NO: Si solo te interesan las activas con historial de búsquedas\n";
    echo "\n";
}

if ($notariasSoloDesktop->count() > 0) {
    echo "3. Las {$notariasSoloDesktop->count()} notarías 'desktop-only' son importantes:\n";
    echo "   - Usan Visual Basic 6.0 (acceso directo a API)\n";
    echo "   - No necesitan registro web\n";
    echo "   - Tienen historial valioso de búsquedas\n";
    echo "   ✅ ESTÁN correctamente incluidas en el catálogo\n";
    echo "\n";
}

echo "4. Proporción de uso:\n";
$totalConBusquedas = $notariasCatalogo->count();
$totalRegistradas = $notariasUsuarioUnicas->count();
$proporcion = round(($totalConBusquedas / ($totalConBusquedas + $notariasSinBusquedas->count())) * 100, 1);
echo "   {$proporcion}% de notarías registradas SÍ han usado el sistema\n";

echo "\n";
