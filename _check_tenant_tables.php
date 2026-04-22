<?php
// Script temporal para auditar las tablas de los tenants
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenants = [
    'atinet_edomex_notaria_10',
    'atinet_edomex_notaria_11',
    'atinet_mor_notaria_10',
    'atinet_oax_notaria_113',
];

$masterTables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
$masterList = array_map(fn($t) => array_values((array)$t)[0], $masterTables);
sort($masterList);

echo "=== TABLAS EN MASTER (atinet_compliance_hub) ===\n";
echo "Total: " . count($masterList) . "\n";
foreach ($masterList as $t) echo "  $t\n";

foreach ($tenants as $tenantDb) {
    \Illuminate\Support\Facades\Config::set('database.connections.tenant_check', array_merge(
        config('database.connections.mysql'),
        ['database' => $tenantDb]
    ));
    \Illuminate\Support\Facades\DB::purge('tenant_check');

    try {
        $tenantTables = \Illuminate\Support\Facades\DB::connection('tenant_check')->select('SHOW TABLES');
        $tenantList = array_map(fn($t) => array_values((array)$t)[0], $tenantTables);
        sort($tenantList);

        $missing = array_diff($masterList, $tenantList);
        $extra = array_diff($tenantList, $masterList);

        echo "\n=== TENANT: $tenantDb ===\n";
        echo "Tablas en tenant: " . count($tenantList) . "\n";
        echo "Tablas FALTANTES vs master (" . count($missing) . "):\n";
        foreach ($missing as $m) echo "  FALTA: $m\n";
        if ($extra) {
            echo "Tablas EXTRA en tenant (" . count($extra) . "):\n";
            foreach ($extra as $e) echo "  EXTRA: $e\n";
        }
    } catch (\Exception $e) {
        echo "  ERROR: " . $e->getMessage() . "\n";
    }
}
