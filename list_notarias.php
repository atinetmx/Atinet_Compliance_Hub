<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== NOTARIAS EN EL SISTEMA ===\n\n";

$notarias = DB::table('notarias')
    ->orderBy('numero_notaria')
    ->get();

echo 'Total de notarías: '.$notarias->count()."\n\n";

if ($notarias->count() > 0) {
    echo "Listado de notarías:\n";
    echo str_repeat('-', 80)."\n";

    foreach ($notarias as $notaria) {
        echo sprintf("ID: %-4d | Número: %-4s | %s\n",
            $notaria->id,
            $notaria->numero_notaria ?? 'N/A',
            $notaria->nombre ?? 'SIN NOMBRE'
        );
    }

    echo str_repeat('-', 80)."\n";

    // Buscar si hay algo relacionado con "142" o "etla"
    echo "\nBuscando términos relacionados con '142' o 'etla':\n";
    $related = DB::table('notarias')
        ->where('numero_notaria', 'LIKE', '%142%')
        ->orWhere('nombre', 'LIKE', '%142%')
        ->orWhere('nombre', 'LIKE', '%etla%')
        ->get();

    if ($related->count() > 0) {
        echo "ENCONTRADAS {$related->count()} notarías relacionadas:\n";
        foreach ($related as $not) {
            echo "  - ID: {$not->id}, Número: {$not->numero_notaria}, Nombre: {$not->nombre}\n";
        }
    } else {
        echo "No se encontraron notarías con '142' o 'etla' en nombre o número\n";
    }
}
