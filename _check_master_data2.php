<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TABLAS tbl_ EN MASTER (atinet_compliance_hub) ===\n\n";

$tables = [
    'tbl_cat_usuarios',
    'tbl_cat_roles',
    'tbl_cat_operaciones',
    'tbl_cat_municipios',
    'tbl_cfg_configuracion_notarial',
    'tbl_log_general',
    'tbl_log_sesiones_activas',
    'tbl_log_sesiones',
];

foreach ($tables as $t) {
    try {
        $count = DB::table($t)->count();
        echo "  {$t}: {$count} registros\n";
    } catch (\Exception $e) {
        echo "  {$t}: NO EXISTE — {$e->getMessage()}\n";
    }
}

echo "\n=== tbl_cat_roles ===\n";
try {
    DB::table('tbl_cat_roles')->get()->each(fn ($r) => print ('  '.json_encode($r)."\n"));
} catch (\Exception $e) {
    echo '  ERROR: '.$e->getMessage()."\n";
}

echo "\n=== tbl_cat_usuarios agrupado por Numero_Notaria ===\n";
try {
    DB::table('tbl_cat_usuarios')
        ->select('Numero_Notaria', DB::raw('COUNT(*) as total'))
        ->groupBy('Numero_Notaria')
        ->get()
        ->each(fn ($r) => print ("  Numero_Notaria='{$r->Numero_Notaria}' → {$r->total} usuarios\n"));
} catch (\Exception $e) {
    echo '  ERROR: '.$e->getMessage()."\n";
}

echo "\n=== tbl_cfg_configuracion_notarial ===\n";
try {
    DB::table('tbl_cfg_configuracion_notarial')->get()
        ->each(fn ($r) => print ('  '.json_encode($r)."\n"));
} catch (\Exception $e) {
    echo '  ERROR: '.$e->getMessage()."\n";
}

// Últimos errores del proxy
echo "\n=== Últimos mensajes CnProxy en laravel.log ===\n";
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $lines = array_reverse(file($logFile));
    $found = 0;
    foreach ($lines as $line) {
        if (str_contains($line, 'CnProxy') || str_contains($line, 'GetRol') || str_contains($line, 'GetUsuario')) {
            echo '  '.trim($line)."\n";
            if (++$found >= 10) {
                break;
            }
        }
    }
    if ($found === 0) {
        echo "  (sin entradas recientes)\n";
    }
}
