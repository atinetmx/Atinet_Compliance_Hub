<?php

/**
 * Script de prueba de conexión a Hostgator
 * Verifica que las credenciales atinet65_ucompliance funcionen
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "🔍 VERIFICACIÓN DE CONEXIONES REMOTAS A HOSTGATOR\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "Usuario: atinet65_ucompliance\n";
echo "Host: 162.144.6.1\n\n";

$connections = [
    'ofac_remote' => [
        'name' => 'OFAC Remota',
        'table' => 'Nombres',
    ],
    'sat_remote' => [
        'name' => 'SAT Remota',
        'table' => '69-B',
    ],
];

$allOk = true;

foreach ($connections as $conn => $info) {
    echo "Probando {$info['name']}...\n";

    try {
        // Intentar conexión
        $count = DB::connection($conn)->table($info['table'])->count();
        echo "  ✅ Conectado correctamente\n";
        echo '  📊 Registros encontrados: '.number_format($count)."\n\n";
    } catch (\Exception $e) {
        $allOk = false;
        echo '  ❌ Error: '.$e->getMessage()."\n\n";
    }
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

if ($allOk) {
    echo "✅ TODAS LAS CONEXIONES FUNCIONAN CORRECTAMENTE\n";
    echo "\nPuedes ejecutar: php artisan blacklists:sync --test\n";
    exit(0);
} else {
    echo "❌ ALGUNAS CONEXIONES FALLARON\n\n";
    echo "💡 Posibles causas:\n";
    echo "   - Credenciales incorrectas\n";
    echo "   - IP no permitida en Hostgator (whitelist)\n";
    echo "   - Puerto 3306 bloqueado por firewall\n";
    echo "   - Acceso remoto a MySQL no habilitado en Hostgator\n";
    exit(1);
}
