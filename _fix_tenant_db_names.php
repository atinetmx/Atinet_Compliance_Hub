<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Mapeo correcto basado en las BDs tenant que realmente existen en MySQL
$correcciones = [
    1 => 'atinet_edomex_notaria_11',   // noteria 11 cuatitlan mexico (Estado de México, #11)
    2 => 'atinet_edomex_notaria_10',   // NOTARIA 10 COLIMA (estado=México en BD, BD existe como edomex_10)
    3 => 'atinet_mor_notaria_10',      // 10Cuernavaca (Morelos, #10)
    4 => 'atinet_oax_notaria_113',     // 113huatulco (Oaxaca, #113)
    6 => 'atinet_edomex_notaria_60',   // Notaria 60 Ecatepec (Estado de México, #60)
];

echo "=== Corrigiendo tenant_db_name ===\n\n";
foreach ($correcciones as $id => $dbName) {
    $n = DB::table('notarias')->where('id', $id)->first(['id', 'nombre', 'tenant_db_name']);
    if (! $n) {
        echo "  [SKIP] id={$id} no encontrada\n";

        continue;
    }
    DB::table('notarias')->where('id', $id)->update(['tenant_db_name' => $dbName]);
    echo "  [{$id}] {$n->nombre}\n";
    echo "         antes: {$n->tenant_db_name}\n";
    echo "         ahora: {$dbName}\n\n";
}

echo "=== Verificación final ===\n\n";
$notarias = DB::table('notarias')->get(['id', 'nombre', 'numero_notaria', 'estado', 'tenant_db_name']);
foreach ($notarias as $n) {
    echo "  [{$n->id}] {$n->nombre} (#{$n->numero_notaria}, {$n->estado}) → {$n->tenant_db_name}\n";
}

// Mostrar estado actual de notarías vs BDs tenant reales
echo "=== Notarías en BD y sus tenant_db_name calculados ===\n\n";
$notarias = DB::table('notarias')->get(['id', 'nombre', 'numero_notaria', 'estado', 'tenant_db_name']);
foreach ($notarias as $n) {
    echo "  [{$n->id}] {$n->nombre} | estado={$n->estado} | numero={$n->numero_notaria}\n";
    echo "       tenant_db_name actual = {$n->tenant_db_name}\n\n";
}

// BDs tenant reales que existen
echo "=== BDs tenant que realmente existen en MySQL ===\n\n";
$dbs = DB::select("SHOW DATABASES LIKE 'atinet_%'");
foreach ($dbs as $db) {
    $name = array_values((array) $db)[0];
    if ($name !== 'atinet_compliance_hub') {
        echo "  {$name}\n";
    }
}

echo "\n=== CORRECCIONES NECESARIAS ===\n";
echo "Mapeo correcto (id → tenant_db_name):\n";
// Mostrar qué debería ser cada una
$mapa = [
    // Ajusta estos mapeos según lo que ves en la salida
];
