<?php

/**
 * Backfill tbl_cfg_notaria para todas las notarías existentes.
 * - Inserta en la BD de cada tenant (Id=1, un registro por BD)
 * - Inserta en la BD master (para el panel C# super-admin)
 */
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$notarias = DB::table('notarias')->orderBy('id')->get();
echo "=== BACKFILL tbl_cfg_notaria ===\n\n";

foreach ($notarias as $notaria) {
    echo "Notaría #{$notaria->numero_notaria} ({$notaria->nombre}) → {$notaria->tenant_db_name}\n";

    $domicilio = trim(implode(' ', array_filter([
        $notaria->calle ?? '',
        $notaria->colonia ?? '',
    ])));
    if (! $domicilio) {
        $domicilio = $notaria->direccion ?? '';
    }

    $params = [
        $notaria->contacto_principal ?? $notaria->nombre,
        $notaria->numero_notaria,
        substr($notaria->telefono ?? '', 0, 10),
        'N/A',
        $domicilio,
        $notaria->municipio ?? '',
        $notaria->estado ?? '',
        substr($notaria->codigo_postal ?? '', 0, 10),
    ];

    // ── Tenant DB ──────────────────────────────────────────────────────────
    $db = $notaria->tenant_db_name;
    try {
        $sql = "INSERT INTO `{$db}`.`tbl_cfg_notaria`
                    (`Id`, `Nombre_Notario`, `Numero_Notaria`, `Telefono`, `RFC`,
                     `Domicilio`, `Municipio`, `Estado`, `Codigo_Postal`, `Logotipo`, `Fecha_Creacion`)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, '', NOW())
                ON DUPLICATE KEY UPDATE
                    `Nombre_Notario` = VALUES(`Nombre_Notario`),
                    `Numero_Notaria` = VALUES(`Numero_Notaria`),
                    `Telefono`       = VALUES(`Telefono`),
                    `Domicilio`      = VALUES(`Domicilio`),
                    `Municipio`      = VALUES(`Municipio`),
                    `Estado`         = VALUES(`Estado`),
                    `Codigo_Postal`  = VALUES(`Codigo_Postal`)";
        DB::statement($sql, $params);
        echo "  ✅ tenant BD: OK\n";
    } catch (\Exception $e) {
        echo '  ❌ tenant BD ERROR: '.$e->getMessage()."\n";
    }

    // ── Master DB ──────────────────────────────────────────────────────────
    try {
        $sqlMaster = "INSERT INTO `tbl_cfg_notaria`
                          (`Nombre_Notario`, `Numero_Notaria`, `Telefono`, `RFC`,
                           `Domicilio`, `Municipio`, `Estado`, `Codigo_Postal`, `Logotipo`, `Fecha_Creacion`)
                      SELECT ?, ?, ?, ?, ?, ?, ?, ?, '', NOW()
                      WHERE NOT EXISTS (
                          SELECT 1 FROM `tbl_cfg_notaria`
                          WHERE `Numero_Notaria` = ?
                            AND `Municipio` = ?
                      )";
        DB::statement($sqlMaster, array_merge($params, [$notaria->numero_notaria, $notaria->municipio ?? '']));
        echo "  ✅ master BD: OK\n";
    } catch (\Exception $e) {
        echo '  ❌ master BD ERROR: '.$e->getMessage()."\n";
    }
}

echo "\n=== ESTADO FINAL ===\n";
$masterRows = DB::table('tbl_cfg_notaria')->select('Id', 'Nombre_Notario', 'Numero_Notaria', 'Municipio', 'Estado')->get();
echo 'Master tbl_cfg_notaria ('.$masterRows->count()." registros):\n";
foreach ($masterRows as $r) {
    echo "  Id={$r->Id} | N°={$r->Numero_Notaria} | {$r->Nombre_Notario} | {$r->Municipio}, {$r->Estado}\n";
}
