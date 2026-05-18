<?php

/**
 * Script simple para verificar conexión remota a Hostgator
 *
 * Uso: php verify_remote_connection.php
 */

require_once __DIR__.'/remote_db_connector.php';

echo "\n";
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║     VERIFICACIÓN DE CONEXIÓN REMOTA A HOSTGATOR             ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n";
echo "\n";

$connector = new RemoteDBConnector;

// Test de conexiones
echo "🔍 Probando conexiones...\n\n";

$testResults = $connector->testAllConnections();
$allOk = true;
$criticalDatabases = ['ofac', 'sat', 'aplicativos']; // catalogos es opcional

foreach ($testResults as $database => $result) {
    $label = str_pad($database, 15);

    if ($result['status'] === 'OK') {
        $version = isset($result['server_version']) ? " (MySQL {$result['server_version']})" : '';
        echo "  ✅ {$label} → Conectado{$version}\n";
    } else {
        // Solo marcar error si es una BD crítica
        if (in_array($database, $criticalDatabases)) {
            $allOk = false;
            echo "  ❌ {$label} → {$result['message']}\n";
        } else {
            echo "  ⚠️  {$label} → Sin acceso (opcional)\n";
        }
    }
}

echo "\n";

if (! $allOk) {
    echo "⚠️  Algunas conexiones fallaron. Verifica:\n";
    echo "   - Firewall permite conexión al puerto 3306\n";
    echo "   - IP tiene acceso remoto habilitado en Hostgator\n";
    echo "   - Credenciales en remote_db_connector.php son correctas\n";
    exit(1);
}

// Estadísticas rápidas
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 Estadísticas de Bases de Datos\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

try {
    // OFAC
    $ofacSdn = $connector->count('ofac', 'SDN');
    $ofacConsultas = $connector->count('ofac', 'consultas');

    echo "📋 OFAC:\n";
    echo '   Registros SDN: '.number_format($ofacSdn)."\n";
    echo '   Total consultas: '.number_format($ofacConsultas)."\n";

    // SAT
    $sat69B = $connector->count('sat', '69-B');
    $satConsultas = $connector->count('sat', 'consultas');

    echo "\n📋 SAT:\n";
    echo '   Registros 69-B: '.number_format($sat69B)."\n";
    echo '   Total consultas: '.number_format($satConsultas)."\n";

    // Aplicativos - tablas disponibles
    $aplicativosTables = $connector->getTables('aplicativos');

    echo "\n📦 Aplicativos:\n";
    echo '   Tablas disponibles: '.count($aplicativosTables)."\n";
    echo '   Principales: '.implode(', ', array_slice($aplicativosTables, 0, 5))."...\n";

} catch (Exception $e) {
    echo '❌ Error obteniendo estadísticas: '.$e->getMessage()."\n";
}

echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ Verificación completada - Todo funcionando correctamente\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "\n";

echo "💡 Siguiente paso:\n";
echo "   php remote_db_connector.php  # Ver ejemplos completos de uso\n";
echo "\n";
