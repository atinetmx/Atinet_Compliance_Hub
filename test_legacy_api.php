w<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

echo "=== TESTING LEGACY API ===\n\n";

// 1. Test catalog exists
echo "1️⃣ Verificando catálogo guardado...\n";
$filename = 'catalogo_notarias_legacy.json';
if (Storage::disk('local')->exists($filename)) {
    echo "   ✅ Catálogo existe: ".Storage::disk('local')->path($filename)."\n";
    $json = Storage::disk('local')->get($filename);
    $catalog = json_decode($json, true);
    echo "   📊 Total notarías: ".count($catalog['notarias'])."\n";
    echo "   🕐 Generado: ".$catalog['generated_at']."\n";
} else {
    echo "   ❌ Catálogo NO existe\n";
}

echo "\n";

// 2. Test cache
echo "2️⃣ Verificando caché...\n";
if (Cache::has('catalogo-notarias-legacy')) {
    echo "   ✅ Caché existe\n";
    $cached = Cache::get('catalogo-notarias-legacy');
    // Handle both array formats
    if (is_array($cached) && isset($cached['notarias'])) {
        echo "   📊 Notarías en caché: ".count($cached['notarias'])."\n";
    } elseif (is_array($cached)) {
        echo "   📊 Notarías en caché: ".count($cached)."\n";
    }
} else {
    echo "   ⚠️  Caché vacío (se creará en primera petición)\n";
}

echo "\n";

// 3. Test controller methods (simulate)
echo "3️⃣ Probando métodos del controlador...\n";

use App\Http\Controllers\Admin\LegacyController;

try {
    $controller = new LegacyController();

    // Test catalog retrieval
    echo "   🔍 GET /admin/legacy/notarias/catalog...\n";
    $request = new \Illuminate\Http\Request();
    $response = $controller->getNotariasCatalog($request);
    $data = json_decode($response->getContent(), true);
    echo "   ✅ Total notarías: ".$data['total_notarias']."\n";
    echo "   📅 Generado: ".$data['generated_at']."\n";

    echo "\n";

    // Test statistics
    echo "   📊 GET /admin/legacy/notarias/statistics...\n";
    $response = $controller->getStatistics();
    $stats = json_decode($response->getContent(), true);
    echo "   ✅ Total notarías: ".$stats['total_notarias']."\n";
    echo "   🟢 Activas: ".$stats['notarias_activas']."\n";
    echo "   🔴 Inactivas: ".$stats['notarias_inactivas']."\n";
    echo "   🔢 Total búsquedas: ".number_format($stats['total_busquedas'])."\n";
    echo "   📈 Promedio búsquedas: ".number_format($stats['promedio_busquedas'], 2)."\n";

    echo "\n   🔝 Top 5 notarías:\n";
    foreach (array_slice($stats['top_notarias'], 0, 5) as $notaria) {
        $estado = $notaria['es_activa'] ? '🟢' : '🔴';
        echo "      {$estado} {$notaria['notaria_id']}: ".number_format($notaria['total_busquedas'])." búsquedas\n";
    }

    echo "\n   📌 Fuentes:\n";
    foreach ($stats['fuentes'] as $fuente => $count) {
        echo "      • {$fuente}: {$count} notarías\n";
    }

    echo "\n";

    // Test search
    echo "   🔎 GET /admin/legacy/notarias/search?query=142...\n";
    $searchRequest = new \Illuminate\Http\Request(['query' => '142']);
    $response = $controller->searchNotarias($searchRequest);
    $results = json_decode($response->getContent(), true);
    echo "   ✅ Resultados encontrados: ".$results['total_results']."\n";

    if ($results['total_results'] > 0) {
        echo "   📋 Notarías encontradas:\n";
        foreach ($results['results'] as $notaria) {
            $estado = $notaria['es_activa'] ? '🟢' : '🔴';
            echo "      {$estado} {$notaria['notaria_id']} - ".number_format($notaria['total_busquedas'])." búsquedas\n";
        }
    }

    echo "\n";
    echo "✅ TODAS LAS PRUEBAS PASARON\n";

} catch (Exception $e) {
    echo "   ❌ Error: ".$e->getMessage()."\n";
    echo "   📍 ".$e->getFile().":".$e->getLine()."\n";
}
