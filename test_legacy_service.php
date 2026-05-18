<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\BusquedasLegacyService;

echo "==================================================\n";
echo "Probando BusquedasLegacyService con 10Cuernavaca\n";
echo "==================================================\n\n";

$service = new BusquedasLegacyService;
$legacyId = '10Cuernavaca';

try {
    // 1. Obtener estadísticas
    echo "--- Estadísticas Legacy ---\n";
    $stats = $service->getEstadisticas($legacyId);

    echo 'Total búsquedas: '.number_format($stats['total'])."\n";
    echo "Por fuente:\n";
    echo '  - Web: '.number_format($stats['por_fuente']['web'])."\n";
    echo '  - Desktop: '.number_format($stats['por_fuente']['desktop'])."\n";
    echo '  - OFAC: '.number_format($stats['por_fuente']['ofac'])."\n";
    echo '  - SAT: '.number_format($stats['por_fuente']['sat'])."\n";
    echo 'Primera búsqueda: '.($stats['primera_busqueda'] ?? 'N/A')."\n";
    echo 'Última búsqueda: '.($stats['ultima_busqueda'] ?? 'N/A')."\n\n";

    // 2. Obtener búsquedas consolidadas (últimas 20)
    echo "--- Últimas 20 Búsquedas ---\n";
    $result = $service->getBusquedasConsolidadas($legacyId, ['limit' => 20]);

    echo 'Total encontradas: '.number_format($result['total'])."\n";
    echo 'Mostrando: '.count($result['busquedas'])."\n";
    echo '¿Hay más?: '.($result['has_more'] ? 'Sí' : 'No')."\n\n";

    echo "📋 Registros:\n";
    foreach (array_slice($result['busquedas'], 0, 10) as $i => $busqueda) {
        $num = $i + 1;
        echo "\n{$num}. [{$busqueda['fuente']}] {$busqueda['fecha']}\n";
        echo "   Tipo: {$busqueda['tipo_busqueda']}\n";
        echo "   Término: {$busqueda['termino_busqueda']}\n";
        if (isset($busqueda['resultado_nombre'])) {
            echo "   Resultado nombre: {$busqueda['resultado_nombre']}\n";
        }
        if (! empty($busqueda['rfc'])) {
            echo "   RFC: {$busqueda['rfc']}";
            if (isset($busqueda['resultado_rfc'])) {
                echo " (Resultado: {$busqueda['resultado_rfc']})";
            }
            echo "\n";
        }
        echo "   Usuario: {$busqueda['usuario']}\n";
    }

    // 3. Probar filtros
    echo "\n\n--- Filtros ---\n";

    // Solo OFAC
    $ofacOnly = $service->getBusquedasConsolidadas($legacyId, ['limit' => 5, 'fuente' => 'ofac']);
    echo 'Solo OFAC: '.number_format($ofacOnly['total'])." búsquedas\n";

    // Solo SAT
    $satOnly = $service->getBusquedasConsolidadas($legacyId, ['limit' => 5, 'fuente' => 'sat']);
    echo 'Solo SAT: '.number_format($satOnly['total'])." búsquedas\n";

    // Solo Web
    $webOnly = $service->getBusquedasConsolidadas($legacyId, ['limit' => 5, 'fuente' => 'web']);
    echo 'Solo Web: '.number_format($webOnly['total'])." búsquedas\n";

    // Solo Desktop
    $desktopOnly = $service->getBusquedasConsolidadas($legacyId, ['limit' => 5, 'fuente' => 'desktop']);
    echo 'Solo Desktop: '.number_format($desktopOnly['total'])." búsquedas\n";

    echo "\n✅ Servicio funcionando correctamente!\n";

} catch (Exception $e) {
    echo "\n❌ Error: ".$e->getMessage()."\n";
    echo "\nStack trace:\n".$e->getTraceAsString()."\n";
    exit(1);
}

echo "\n==================================================\n";
echo "Puedes verificar la UI en:\n";
echo "http://localhost/admin/notarias/3\n";
echo "==================================================\n";
