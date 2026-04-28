<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$n = App\Models\Notaria::where('numero_notaria', 60)->first();
if (! $n) {
    echo "NO ENCONTRADA\n";
    exit;
}
echo 'nombre: '.$n->nombre."\n";
echo 'legacy_identifier: '.$n->legacy_identifier."\n";
echo 'slug: '.($n->slug ?? 'NULL')."\n";

// También revisar los últimos registros en atinet65_aplicativos con notaria = 60ecatepec
try {
    // Ver columnas de la tabla
    $cols = DB::connection('aplicativos')->select('SHOW COLUMNS FROM registro');
    echo 'Columnas: '.implode(', ', array_column($cols, 'Field'))."\n\n";

    $rows = DB::connection('aplicativos')
        ->table('registro')
        ->where('notaria', $n->legacy_identifier)
        ->orderByDesc('dia_registro')
        ->limit(5)
        ->get(['notaria', 'dia_registro', 'nombre', 'Apellido_paterno']);
    echo "\nÚltimos 5 registros con notaria='".$n->legacy_identifier."':\n";
    foreach ($rows as $r) {
        echo "  notaria={$r->notaria} | dia={$r->dia_registro} | {$r->nombre} {$r->Apellido_paterno}\n";
    }
} catch (Exception $e) {
    echo 'Error consultando aplicativos: '.$e->getMessage()."\n";
}
