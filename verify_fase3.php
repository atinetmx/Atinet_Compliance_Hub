<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Notaria;
use Illuminate\Support\Facades\Schema;

echo "=== VERIFICACIÓN FASE 3: INTEGRACIÓN LEGACY ===\n\n";

// 1. Verificar campo legacy_identifier en tabla notarias
echo "1️⃣ Verificando estructura de tabla notarias...\n";
$columns = Schema::getColumnListing('notarias');

$requiredColumns = [
    'legacy_identifier',
    'legacy_busquedas_count',
    'legacy_ultima_busqueda',
];

foreach ($requiredColumns as $column) {
    if (in_array($column, $columns)) {
        echo "   ✅ Columna '{$column}' existe\n";
    } else {
        echo "   ❌ Columna '{$column}' NO EXISTE\n";
    }
}

echo "\n";

// 2. Verificar que el catálogo legacy está disponible
echo "2️⃣ Verificando catálogo legacy...\n";
use Illuminate\Support\Facades\Storage;

$filename = 'catalogo_notarias_legacy.json';
if (Storage::disk('local')->exists($filename)) {
    $json = Storage::disk('local')->get($filename);
    $catalog = json_decode($json, true);
    echo "   ✅ Catálogo existe\n";
    echo '   📊 Total notarías legacy: '.count($catalog['notarias'])."\n";

    // Mostrar algunas notarías con sus estadísticas
    echo "\n   🔝 Top 5 notarías con más búsquedas:\n";
    foreach (array_slice($catalog['notarias'], 0, 5) as $notaria) {
        $estado = $notaria['es_activa'] ? '🟢' : '🔴';
        echo "      {$estado} {$notaria['notaria_id']}: ".number_format($notaria['total_busquedas'])." búsquedas\n";
    }
} else {
    echo "   ❌ Catálogo NO existe. Ejecuta: php artisan catalog:generate-notarias\n";
}

echo "\n";

// 3. Verificar rutas API
echo "3️⃣ Verificando rutas API legacy...\n";

$routes = [
    'admin.legacy.notarias.catalog' => 'GET /admin/legacy/notarias/catalog',
    'admin.legacy.notarias.search' => 'GET /admin/legacy/notarias/search',
    'admin.legacy.notarias.refresh' => 'POST /admin/legacy/notarias/refresh',
    'admin.legacy.notarias.statistics' => 'GET /admin/legacy/notarias/statistics',
];

foreach ($routes as $name => $description) {
    if (Route::has($name)) {
        echo "   ✅ Ruta '{$description}' registrada\n";
    } else {
        echo "   ❌ Ruta '{$name}' NO REGISTRADA\n";
    }
}

echo "\n";

// 4. Verificar notarías existentes con legacy_identifier
echo "4️⃣ Verificando notarías con identificador legacy...\n";
$notariasConLegacy = Notaria::whereNotNull('legacy_identifier')->get();

if ($notariasConLegacy->count() > 0) {
    echo "   ✅ Encontradas {$notariasConLegacy->count()} notarías con legacy_identifier:\n";
    foreach ($notariasConLegacy as $notaria) {
        echo "      • {$notaria->nombre} → {$notaria->legacy_identifier}\n";
        if ($notaria->legacy_busquedas_count) {
            echo '        📊 '.number_format($notaria->legacy_busquedas_count)." búsquedas legacy\n";
        }
    }
} else {
    echo "   ℹ️  No hay notarías vinculadas con sistema legacy aún\n";
    echo "      (Se pueden crear desde /admin/notarias/create)\n";
}

echo "\n";

// 5. Verificar componente frontend
echo "5️⃣ Verificando componentes frontend...\n";
$frontendFiles = [
    'resources/js/components/Admin/LegacyNotariaAutocomplete.tsx',
    'resources/js/pages/Admin/Notarias/Create.tsx',
];

foreach ($frontendFiles as $file) {
    if (file_exists($file)) {
        echo "   ✅ {$file} existe\n";
    } else {
        echo "   ❌ {$file} NO EXISTE\n";
    }
}

echo "\n";

// 6. Simular búsqueda en catálogo
echo "6️⃣ Probando búsqueda en catálogo legacy...\n";

use App\Http\Controllers\Admin\LegacyController;

try {
    $controller = new LegacyController;
    $request = new \Illuminate\Http\Request(['query' => '10']);
    $response = $controller->searchNotarias($request);
    $results = json_decode($response->getContent(), true);

    echo "   ✅ Búsqueda funcional\n";
    echo "   🔍 Query: '10' → {$results['total_results']} resultados\n";

    if ($results['total_results'] > 0) {
        echo "   📋 Primeros 3 resultados:\n";
        foreach (array_slice($results['results'], 0, 3) as $notaria) {
            $estado = $notaria['es_activa'] ? '🟢' : '🔴';
            echo "      {$estado} {$notaria['notaria_id']} - ".number_format($notaria['total_busquedas'])." búsquedas\n";
        }
    }
} catch (Exception $e) {
    echo '   ❌ Error en búsqueda: '.$e->getMessage()."\n";
}

echo "\n";

// 7. Resumen final
echo "=== RESUMEN FASE 3 ===\n\n";

$checksPassed = 0;
$totalChecks = 6;

// Check 1: Columnas en base de datos
if (in_array('legacy_identifier', $columns)) {
    $checksPassed++;
}

// Check 2: Catálogo existe
if (Storage::disk('local')->exists($filename)) {
    $checksPassed++;
}

// Check 3: Rutas registradas
if (Route::has('admin.legacy.notarias.catalog')) {
    $checksPassed++;
}

// Check 4: Archivos frontend existen
if (file_exists('resources/js/components/Admin/LegacyNotariaAutocomplete.tsx')) {
    $checksPassed++;
}

// Check 5: Migration ejecutada
if (in_array('legacy_busquedas_count', $columns)) {
    $checksPassed++;
}

// Check 6: API funcional
try {
    $controller = new LegacyController;
    $request = new \Illuminate\Http\Request(['query' => 'test']);
    $response = $controller->searchNotarias($request);
    $checksPassed++;
} catch (Exception $e) {
    // API no funcional
}

$percentage = round(($checksPassed / $totalChecks) * 100);

echo "✅ Checks pasados: {$checksPassed}/{$totalChecks} ({$percentage}%)\n\n";

if ($checksPassed === $totalChecks) {
    echo "🎉 ¡FASE 3 COMPLETADA EXITOSAMENTE!\n";
    echo "\n📝 Próximos pasos:\n";
    echo "   1. Crear una notaría desde /admin/notarias/create\n";
    echo "   2. Buscar una notaría legacy (ej: 10Cuernavaca)\n";
    echo "   3. Seleccionarla para vincular historial\n";
    echo "   4. Continuar con Fase 4: Consulta de búsquedas legacy en tiempo real\n";
} else {
    echo "⚠️  Algunos checks fallaron. Revisa los errores arriba.\n";
}

echo "\n";
