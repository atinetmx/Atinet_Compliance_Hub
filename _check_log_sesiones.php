<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$cols = DB::select('DESCRIBE tbl_log_sesiones_activas');
$existing = collect($cols)->pluck('Field')->toArray();
echo "Columnas actuales: " . implode(', ', $existing) . "\n";

$needed = [
    'Equipo'                        => 'VARCHAR(100) NULL',
    'Refresh_Token'                 => 'TEXT NULL',
    'Refresh_Token_Epiration_Time'  => 'DATETIME NULL',
    'Refresh_Token_Expiration_Time' => 'DATETIME NULL',
    'Ip_Address'                    => 'VARCHAR(50) NULL',
    'User_Agent'                    => 'TEXT NULL',
    'Es_Activa'                     => 'TINYINT(1) NOT NULL DEFAULT 1',
    'Fecha_Expiracion'              => 'DATETIME NULL',
    'Refresh_Token_Hash'            => 'TEXT NULL',
];

foreach ($needed as $col => $type) {
    if (!in_array($col, $existing)) {
        DB::statement("ALTER TABLE `tbl_log_sesiones_activas` ADD COLUMN `{$col}` {$type}");
        echo "Agregada: {$col}\n";
    }
}
echo "Listo\n";
