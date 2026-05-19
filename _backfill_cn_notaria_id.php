<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Mapeo estado abrev -> nombre en tbl_cfg_notaria
$estadoMap = [
    'edomex' => ['México', 'ESTADO DE MEXICO', 'Estado de México'],
    'mor' => ['Morelos'],
    'oax' => ['Oaxaca'],
    'cdmx' => ['Ciudad de México', 'CDMX'],
    'jal' => ['Jalisco'],
    'nl' => ['Nuevo León'],
    'pue' => ['Puebla'],
];

$notarias = DB::table('notarias')->get();
$cnNotarias = DB::table('tbl_cfg_notaria')->select('Id', 'Numero_Notaria', 'Estado')->get();

$updated = 0;
$manual = [];

foreach ($notarias as $n) {
    // Extraer abrev del estado desde tenant_db_name: atinet_{estado}_{notaria}_{num}
    // Formato: atinet_edomex_notaria_101 → edomex
    if (preg_match('/^atinet_([a-z]+)_notaria_(\d+)$/', $n->tenant_db_name, $m)) {
        $abrev = $m[1]; // e.g. "edomex"
        $num = $m[2]; // e.g. "101"
        $estados = $estadoMap[$abrev] ?? [];

        // Buscar en tbl_cfg_notaria
        $match = $cnNotarias->first(function ($cn) use ($num, $estados) {
            if ((string) $cn->Numero_Notaria !== (string) $num) {
                return false;
            }
            if (empty($estados)) {
                return true;
            } // si no hay mapa, usar solo num
            foreach ($estados as $e) {
                if (stripos($cn->Estado, $e) !== false || stripos($e, $cn->Estado) !== false) {
                    return true;
                }
            }

            return false;
        });

        if ($match) {
            DB::table('notarias')->where('id', $n->id)->update(['cn_notaria_id' => $match->Id]);
            echo "OK: notaria.id={$n->id} tenant_db={$n->tenant_db_name} → cn_notaria_id={$match->Id}".PHP_EOL;
            $updated++;
        } else {
            $manual[] = "MANUAL: notaria.id={$n->id} tenant_db={$n->tenant_db_name} | num={$num} | abrev={$abrev}";
        }
    } else {
        $manual[] = "PARSE_ERROR: notaria.id={$n->id} tenant_db={$n->tenant_db_name}";
    }
}

echo PHP_EOL."Actualizados: $updated".PHP_EOL;
foreach ($manual as $m) {
    echo $m.PHP_EOL;
}

echo PHP_EOL.'=== VERIFICACIÓN FINAL ==='.PHP_EOL;
$rows = DB::table('notarias')->get(['id', 'numero_notaria', 'tenant_db_name', 'cn_notaria_id']);
foreach ($rows as $r) {
    echo "L.id={$r->id} | num={$r->numero_notaria} | cn_notaria_id={$r->cn_notaria_id} | {$r->tenant_db_name}".PHP_EOL;
}
