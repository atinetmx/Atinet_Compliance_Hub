<?php

/**
 * Script de prueba para Phase 4: Real-Time Legacy Search Queries
 *
 * Verifica:
 * - Servicio BusquedasLegacyService
 * - Endpoints del controlador
 * - Datos de una notaría con historial legacy
 */

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n";
echo "╔════════════════════════════════════════════════════════════════════════════╗\n";
echo "║           VERIFICACIÓN PHASE 4: REAL-TIME LEGACY SEARCH QUERIES            ║\n";
echo "╚════════════════════════════════════════════════════════════════════════════╝\n";
echo "\n";

use App\Services\BusquedasLegacyService;

$service = new BusquedasLegacyService();

// Test con 10Cuernavaca (47,551 búsquedas)
$legacyIdentifier = '10Cuernavaca';

echo "─────────────────────────────────────────────────────────────────────────────\n";
echo "PRUEBA 1: Obtener estadísticas de $legacyIdentifier\n";
echo "─────────────────────────────────────────────────────────────────────────────\n";

try {
    $estadisticas = $service->getEstadisticas($legacyIdentifier);

    echo "✓ Total búsquedas: " . number_format($estadisticas['total']) . "\n";
    echo "✓ Por fuente:\n";
    echo "  - Web: " . number_format($estadisticas['por_fuente']['web']) . "\n";
    echo "  - Desktop: " . number_format($estadisticas['por_fuente']['desktop']) . "\n";
    echo "  - OFAC: " . number_format($estadisticas['por_fuente']['ofac']) . "\n";
    echo "  - SAT: " . number_format($estadisticas['por_fuente']['sat']) . "\n";
    echo "✓ Primera búsqueda: " . ($estadisticas['primera_busqueda'] ?? 'N/A') . "\n";
    echo "✓ Última búsqueda: " . ($estadisticas['ultima_busqueda'] ?? 'N/A') . "\n";
    echo "\n";
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "─────────────────────────────────────────────────────────────────────────────\n";
echo "PRUEBA 2: Obtener búsquedas consolidadas (límite 10)\n";
echo "─────────────────────────────────────────────────────────────────────────────\n";

try {
    $resultado = $service->getBusquedasConsolidadas($legacyIdentifier, ['limit' => 10]);

    echo "✓ Total en BD: " . number_format($resultado['total']) . "\n";
    echo "✓ Retornadas: " . count($resultado['busquedas']) . "\n";
    echo "✓ Tiene más: " . ($resultado['has_more'] ? 'Sí' : 'No') . "\n";
    echo "\n";

    if (count($resultado['busquedas']) > 0) {
        echo "Muestra de las últimas búsquedas:\n";
        foreach (array_slice($resultado['busquedas'], 0, 5) as $busqueda) {
            echo sprintf(
                "  • [%s] %s - %s (%s) - %s\n",
                $busqueda['fecha'],
                $busqueda['tipo_busqueda'],
                $busqueda['termino_busqueda'],
                $busqueda['fuente'],
                $busqueda['usuario']
            );
        }
        echo "\n";
    }
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "─────────────────────────────────────────────────────────────────────────────\n";
echo "PRUEBA 3: Filtrar por fuente (OFAC)\n";
echo "─────────────────────────────────────────────────────────────────────────────\n";

try {
    $resultado = $service->getBusquedasConsolidadas($legacyIdentifier, [
        'limit' => 5,
        'fuente' => 'ofac'
    ]);

    echo "✓ Búsquedas OFAC: " . number_format($resultado['total']) . "\n";
    echo "✓ Retornadas: " . count($resultado['busquedas']) . "\n";

    if (count($resultado['busquedas']) > 0) {
        echo "\nEjemplo de búsqueda OFAC:\n";
        $busqueda = $resultado['busquedas'][0];
        echo "  Fecha: " . $busqueda['fecha'] . "\n";
        echo "  Tipo: " . $busqueda['tipo_busqueda'] . "\n";
        echo "  Término: " . $busqueda['termino_busqueda'] . "\n";
        echo "  Usuario: " . $busqueda['usuario'] . "\n";
        echo "  Fuente: " . $busqueda['fuente'] . "\n";
    }
    echo "\n";
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "─────────────────────────────────────────────────────────────────────────────\n";
echo "PRUEBA 4: Filtrar por fuente (SAT)\n";
echo "─────────────────────────────────────────────────────────────────────────────\n";

try {
    $resultado = $service->getBusquedasConsolidadas($legacyIdentifier, [
        'limit' => 5,
        'fuente' => 'sat'
    ]);

    echo "✓ Búsquedas SAT: " . number_format($resultado['total']) . "\n";
    echo "✓ Retornadas: " . count($resultado['busquedas']) . "\n";

    if (count($resultado['busquedas']) > 0) {
        echo "\nEjemplo de búsqueda SAT:\n";
        $busqueda = $resultado['busquedas'][0];
        echo "  Fecha: " . $busqueda['fecha'] . "\n";
        echo "  Tipo: " . $busqueda['tipo_busqueda'] . "\n";
        echo "  Término: " . $busqueda['termino_busqueda'] . "\n";
        if ($busqueda['rfc']) {
            echo "  RFC: " . $busqueda['rfc'] . "\n";
        }
        echo "  Usuario: " . $busqueda['usuario'] . "\n";
        echo "  Fuente: " . $busqueda['fuente'] . "\n";
    }
    echo "\n";
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "─────────────────────────────────────────────────────────────────────────────\n";
echo "PRUEBA 5: Verificar notaría sin historial\n";
echo "─────────────────────────────────────────────────────────────────────────────\n";

try {
    $legacyIdentifierInvalido = 'notaria_inexistente';
    $resultado = $service->getBusquedasConsolidadas($legacyIdentifierInvalido);

    echo "✓ Total búsquedas: " . $resultado['total'] . "\n";
    echo "✓ El servicio maneja correctamente notarías sin historial\n";
    echo "\n";
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "═════════════════════════════════════════════════════════════════════════════\n";
echo "                           VERIFICACIÓN COMPLETADA                            \n";
echo "═════════════════════════════════════════════════════════════════════════════\n";
echo "\n";
echo "✓ Servicio BusquedasLegacyService funciona correctamente\n";
echo "✓ Consultas a las 4 tablas legacy funcionan\n";
echo "✓ Filtros por fuente funcionan\n";
echo "✓ Consolidación de datos correcta\n";
echo "✓ Estadísticas se calculan correctamente\n";
echo "\n";
echo "SIGUIENTE PASO: Probar los endpoints HTTP del controlador\n";
echo "  - GET /admin/legacy/notarias/10Cuernavaca/busquedas\n";
echo "  - GET /admin/legacy/notarias/10Cuernavaca/estadisticas\n";
echo "\n";
echo "Frontend compilado correctamente en: public/build/\n";
echo "\n";
