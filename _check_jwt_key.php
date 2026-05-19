<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

$tenantDb = 'atinet_edomex_notaria_101';

// Ver tbl_cfg_configuracion_notarial
echo "=== tbl_cfg_configuracion_notarial cols ===\n";
$cols = DB::select("SHOW COLUMNS FROM `{$tenantDb}`.`tbl_cfg_configuracion_notarial`");
foreach ($cols as $c) {
    echo $c->Field.' | '.$c->Type."\n";
}

echo "\n=== Datos ===\n";
$rows = DB::select("SELECT * FROM `{$tenantDb}`.`tbl_cfg_configuracion_notarial` LIMIT 5");
foreach ($rows as $r) {
    $arr = (array) $r;
    foreach ($arr as $k => &$v) {
        if (is_string($v) && strlen($v) > 100) {
            $v = substr($v, 0, 100).'...';
        }
    }
    echo json_encode($arr)."\n";
}

// Buscar en master tb_cfg_configuracion
echo "\n=== master tbl_cfg_configuracion_notarial cols ===\n";
try {
    $cols2 = DB::select("SHOW COLUMNS FROM `atinet_compliance_hub`.`tbl_cfg_configuracion_notarial`");
    foreach ($cols2 as $c) {
        echo $c->Field.' | '.$c->Type."\n";
    }
    $rows2 = DB::select("SELECT * FROM `atinet_compliance_hub`.`tbl_cfg_configuracion_notarial` LIMIT 3");
    foreach ($rows2 as $r) {
        $arr = (array) $r;
        foreach ($arr as $k => &$v) {
            if (is_string($v) && strlen($v) > 100) {
                $v = substr($v, 0, 100).'...';
            }
        }
        echo json_encode($arr)."\n";
    }
} catch (\Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}
