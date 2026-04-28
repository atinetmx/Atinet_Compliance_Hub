<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Tablas tbl_* en BD MASTER (atinet_compliance_hub) ===\n\n";

$tablas = DB::select("
    SELECT TABLE_NAME, TABLE_ROWS
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'atinet_compliance_hub'
    AND TABLE_NAME LIKE 'tbl_%'
    ORDER BY TABLE_ROWS DESC
");

foreach ($tablas as $t) {
    printf("  %-45s  %d filas\n", $t->TABLE_NAME, $t->TABLE_ROWS);
}

echo "\n=== Verificar columna Numero_Notaria en tablas clave ===\n\n";

$tablasClavesCN = [
    'tbl_cat_expedientes',
    'tbl_cat_clientes',
    'tbl_cat_usuarios',
    'tbl_log_sesiones_activas',
    'tbl_cat_operaciones',
    'tbl_cat_actos',
];

foreach ($tablasClavesCN as $tabla) {
    $existe = DB::select("SHOW TABLES LIKE '{$tabla}'");
    if (empty($existe)) {
        echo "  {$tabla}: NO EXISTE en master\n";

        continue;
    }

    $cols = DB::select("SHOW COLUMNS FROM {$tabla}");
    $tieneNotaria = collect($cols)->contains('Field', 'Numero_Notaria');
    $count = DB::table($tabla)->count();
    echo "  {$tabla}: {$count} filas — Numero_Notaria=".($tieneNotaria ? 'SI ✅' : 'NO ❌')."\n";
}

echo "\n=== Muestra de tbl_cat_expedientes (si existe) ===\n\n";
$exExpedientes = DB::select("SHOW TABLES LIKE 'tbl_cat_expedientes'");
if (! empty($exExpedientes)) {
    $cols = DB::select('SHOW COLUMNS FROM tbl_cat_expedientes');
    $colNames = collect($cols)->pluck('Field')->implode(', ');
    echo "Columnas: {$colNames}\n\n";

    $rows = DB::table('tbl_cat_expedientes')->limit(5)->get();
    foreach ($rows as $r) {
        echo '  '.json_encode((array) $r, JSON_UNESCAPED_UNICODE)."\n";
    }
}

echo "\n=== Comparar con BD tenant edomex_notaria_10 ===\n\n";
$tenantDb = 'atinet_edomex_notaria_10';
try {
    config(['database.connections.tenant_check' => [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => $tenantDb,
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'strict' => false,
    ]]);

    foreach ($tablasClavesCN as $tabla) {
        $existe = DB::connection('tenant_check')->select("SHOW TABLES LIKE '{$tabla}'");
        if (empty($existe)) {
            echo "  [{$tenantDb}] {$tabla}: NO EXISTE\n";

            continue;
        }
        $count = DB::connection('tenant_check')->table($tabla)->count();
        echo "  [{$tenantDb}] {$tabla}: {$count} filas\n";
    }
} catch (\Throwable $e) {
    echo '  Error conectando al tenant: '.$e->getMessage()."\n";
}
