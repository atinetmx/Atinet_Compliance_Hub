<?php

/**
 * Script de prueba de endpoints de Catálogos SEPOMEX
 *
 * Verifica que todos los endpoints de la API de catálogos funcionen correctamente
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\CatalogosController;
use Illuminate\Http\Request;

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════╗\n";
echo "║     PRUEBA DE ENDPOINTS - API CATÁLOGOS SEPOMEX              ║\n";
echo "╚═══════════════════════════════════════════════════════════════╝\n";
echo "\n";

$controller = new CatalogosController;
$testsPassed = 0;
$testsFailed = 0;

// ============================================================
// 1. TEST: GET /admin/catalogos/estados
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 1: Obtener todos los estados\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/estados\n\n";

try {
    $response = $controller->getEstados();
    $data = json_decode($response->getContent(), true);

    if ($data['success'] && count($data['data']) === 32) {
        echo "✅ PASÓ: Se obtuvieron {$data['total']} estados correctamente\n";
        echo "Ejemplos:\n";
        for ($i = 0; $i < min(5, count($data['data'])); $i++) {
            $estado = $data['data'][$i];
            echo sprintf("   - %s (código: %02d)\n", $estado['nombre'], $estado['codigo']);
        }
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: Respuesta inesperada\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// 2. TEST: GET /admin/catalogos/municipios?estado=Jalisco
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 2: Obtener municipios de Jalisco\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/municipios?estado=Jalisco\n\n";

try {
    $request = Request::create('/admin/catalogos/municipios', 'GET', ['estado' => 'Jalisco']);
    $response = $controller->getMunicipios($request);
    $data = json_decode($response->getContent(), true);

    if ($data['success'] && $data['total'] > 0) {
        echo "✅ PASÓ: Se obtuvieron {$data['total']} municipios de Jalisco\n";
        echo "Ejemplos:\n";
        for ($i = 0; $i < min(10, count($data['data'])); $i++) {
            $municipio = $data['data'][$i];
            echo sprintf("   - %s (código: %d)\n", $municipio['nombre'], $municipio['codigo']);
        }
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: Respuesta inesperada\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// 3. TEST: GET /admin/catalogos/buscar-cp?cp=44100
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 3: Buscar código postal 44100 (Guadalajara)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/buscar-cp?cp=44100\n\n";

try {
    $request = Request::create('/admin/catalogos/buscar-cp', 'GET', ['cp' => '44100']);
    $response = $controller->buscarCodigoPostal($request);
    $data = json_decode($response->getContent(), true);

    if ($data['success']) {
        echo "✅ PASÓ: Código postal encontrado\n";
        echo sprintf("   Estado: %s\n", $data['data']['estado']);
        echo sprintf("   Municipio: %s\n", $data['data']['municipio']);
        echo sprintf("   Total colonias: %d\n", $data['data']['total_colonias']);
        echo "\nColonias:\n";
        for ($i = 0; $i < min(5, count($data['data']['colonias'])); $i++) {
            $colonia = $data['data']['colonias'][$i];
            echo sprintf("   - %s (%s - %s)\n", $colonia['nombre'], $colonia['tipo'], $colonia['zona']);
        }
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: Respuesta inesperada\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// 4. TEST: GET /admin/catalogos/buscar-cp?cp=99999 (NO EXISTE)
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 4: Buscar código postal inexistente (99999)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/buscar-cp?cp=99999\n\n";

try {
    $request = Request::create('/admin/catalogos/buscar-cp', 'GET', ['cp' => '99999']);
    $response = $controller->buscarCodigoPostal($request);
    $data = json_decode($response->getContent(), true);

    if (! $data['success'] && $response->getStatusCode() === 404) {
        echo "✅ PASÓ: Correctamente retorna 404 para CP inexistente\n";
        echo sprintf("   Mensaje: %s\n", $data['message']);
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: Debería retornar 404\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// 5. TEST: GET /admin/catalogos/estadisticas
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 5: Obtener estadísticas generales\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/estadisticas\n\n";

try {
    $response = $controller->getEstadisticas();
    $data = json_decode($response->getContent(), true);

    if ($data['success']) {
        echo "✅ PASÓ: Estadísticas obtenidas correctamente\n";
        echo sprintf("   Total registros: %s\n", number_format($data['data']['total_registros'], 0, '.', ','));
        echo sprintf("   Total estados: %d\n", $data['data']['total_estados']);
        echo sprintf("   Total municipios: %d\n", $data['data']['total_municipios']);
        echo sprintf("   Total colonias: %s\n", number_format($data['data']['total_colonias'], 0, '.', ','));
        echo sprintf("   Fuente: %s\n", $data['data']['fuente']);
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: Respuesta inesperada\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// 6. TEST: GET /admin/catalogos/regimen-fiscal?codigo=605
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 6: Buscar régimen fiscal por código (605)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/regimen-fiscal?codigo=605\n\n";

try {
    $request = Request::create('/admin/catalogos/regimen-fiscal', 'GET', ['codigo' => '605']);
    $response = $controller->getRegimenFiscal($request);
    $data = json_decode($response->getContent(), true);

    if ($data['success'] && !empty($data['data']['descripcion'])) {
        echo "✅ PASÓ: Régimen fiscal encontrado\n";
        echo sprintf("   Código: %s\n", $data['data']['codigo']);
        echo sprintf("   Descripción: %s\n", $data['data']['descripcion']);
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: No se encontró descripción para código 605\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// 7. TEST: GET /admin/catalogos/regimen-fiscal?codigo=612
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 7: Buscar régimen fiscal por código (612 - Personas Físicas)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/regimen-fiscal?codigo=612\n\n";

try {
    $request = Request::create('/admin/catalogos/regimen-fiscal', 'GET', ['codigo' => '612']);
    $response = $controller->getRegimenFiscal($request);
    $data = json_decode($response->getContent(), true);

    if ($data['success'] && !empty($data['data']['descripcion'])) {
        echo "✅ PASÓ: Régimen fiscal encontrado\n";
        echo sprintf("   Código: %s\n", $data['data']['codigo']);
        echo sprintf("   Descripción: %s\n", $data['data']['descripcion']);
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: No se encontró descripción para código 612\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// 8. TEST: GET /admin/catalogos/regimen-fiscal (lista completa)
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 8: Obtener lista completa de regímenes fiscales\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/regimen-fiscal\n\n";

try {
    $request = Request::create('/admin/catalogos/regimen-fiscal', 'GET');
    $response = $controller->getRegimenFiscal($request);
    $data = json_decode($response->getContent(), true);

    if ($data['success'] && is_array($data['data']) && count($data['data']) > 0) {
        echo sprintf("✅ PASÓ: Se obtuvieron %d regímenes fiscales\n", count($data['data']));
        echo "Ejemplos:\n";
        foreach (array_slice($data['data'], 0, 4) as $rf) {
            echo sprintf("   - [%s] %s\n", $rf['codigo'], $rf['descripcion']);
        }
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: Lista vacía o respuesta inesperada\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// 9. TEST: Código inválido (no numérico)
// ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TEST 9: Código régimen fiscal inválido (debe rechazarse)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Endpoint: GET /admin/catalogos/regimen-fiscal?codigo=ABC\n\n";

try {
    $request = Request::create('/admin/catalogos/regimen-fiscal', 'GET', ['codigo' => 'ABC']);
    $response = $controller->getRegimenFiscal($request);
    $statusCode = $response->getStatusCode();
    $data = json_decode($response->getContent(), true);

    if ($statusCode === 422 || (isset($data['success']) && $data['success'] === false)) {
        echo "✅ PASÓ: Código inválido correctamente rechazado (HTTP {$statusCode})\n";
        $testsPassed++;
    } else {
        echo "❌ FALLÓ: Debería rechazar código no numérico, recibió HTTP {$statusCode}\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
        $testsFailed++;
    }
} catch (\Exception $e) {
    echo '❌ FALLÓ: '.$e->getMessage()."\n";
    $testsFailed++;
}

echo "\n";

// ============================================================
// RESUMEN
// ============================================================

echo "═══════════════════════════════════════════════════════════════\n";
echo "RESUMEN DE PRUEBAS\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$total = $testsPassed + $testsFailed;
$percentage = $total > 0 ? round(($testsPassed / $total) * 100, 2) : 0;

echo sprintf("Total de pruebas: %d\n", $total);
echo sprintf("✅ Pasaron: %d\n", $testsPassed);
echo sprintf("❌ Fallaron: %d\n", $testsFailed);
echo sprintf("Porcentaje de éxito: %.2f%%\n\n", $percentage);

if ($testsFailed === 0) {
    echo "🎉 ¡TODOS LOS ENDPOINTS FUNCIONAN CORRECTAMENTE!\n\n";
    echo "Próximo paso:\n";
    echo "1. Compilar frontend: npm run build\n";
    echo "2. Probar formulario en: /admin/notarias/create\n";
    echo "3. Crear notaría de prueba con legacy_identifier\n\n";
} else {
    echo "⚠️  ALGUNAS PRUEBAS FALLARON\n";
    echo "Revisa los errores antes de continuar\n\n";
}
