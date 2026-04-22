<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Tablas master
$master = collect(DB::select('SHOW TABLES'))->map(fn($r) => array_values((array)$r)[0])->sort()->values();

// Listar tenants
$tenants = collect(DB::select("SHOW DATABASES LIKE 'atinet_%'"))->map(fn($r) => array_values((array)$r)[0])->values();

echo "=== MASTER TABLES (" . $master->count() . ") ===\n";
foreach ($master as $t) echo "  - $t\n";

echo "\n=== TENANT DATABASES ===\n";
foreach ($tenants as $db) echo "  - $db\n";

// Comparar con cada tenant
foreach ($tenants as $tenantDb) {
    config(['database.connections.tenant_audit' => [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => $tenantDb,
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ]]);
    DB::purge('tenant_audit');

    try {
        $tenantTables = collect(DB::connection('tenant_audit')->select('SHOW TABLES'))
            ->map(fn($r) => array_values((array)$r)[0])->sort()->values();

        // Tablas en master que NO están en tenant (excluir tablas multi-tenant que no deben estar)
        $masterOnly = ['cached_responses', 'failed_jobs', 'job_batches', 'jobs', 'ofac_entities', 'ofac_entity_addresses',
            'ofac_entity_aliases', 'ofac_entity_ids', 'ofac_entity_programs', 'password_reset_tokens',
            'sat_contribuyentes', 'sat_sync_log', 'sessions', 'telescope_entries', 'telescope_entries_tags',
            'telescope_monitoring', 'blacklist_sat_rfc', 'blacklist_ofac'];

        $missing = $master->diff($tenantTables)->diff($masterOnly)->values();

        echo "\n=== $tenantDb (" . $tenantTables->count() . " tablas) ===\n";
        echo "  Tablas faltantes: " . ($missing->isEmpty() ? "ninguna" : $missing->implode(', ')) . "\n";

        // Check columnas específicas en tablas importantes
        foreach (['users', 'busquedas', 'plans', 'notarias'] as $checkTable) {
            if ($tenantTables->contains($checkTable)) {
                $masterCols = collect(DB::select("SHOW COLUMNS FROM `$checkTable`"))->pluck('Field')->sort()->values();
                $tenantCols = collect(DB::connection('tenant_audit')->select("SHOW COLUMNS FROM `$checkTable`"))->pluck('Field')->sort()->values();
                $missingCols = $masterCols->diff($tenantCols)->values();
                if ($missingCols->isNotEmpty()) {
                    echo "  Columnas faltantes en $checkTable: " . $missingCols->implode(', ') . "\n";
                }
            }
        }
    } catch (\Exception $e) {
        echo "\n=== $tenantDb ERROR: " . $e->getMessage() . " ===\n";
    }
}
