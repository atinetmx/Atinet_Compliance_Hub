<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "==================================================\n";
echo "Verificando índices de la tabla notarias\n";
echo "==================================================\n\n";

$indexes = DB::select('SHOW INDEX FROM notarias');

echo "Todos los índices:\n";
foreach ($indexes as $idx) {
    echo sprintf(
        "  - Index: %-40s | Column: %-20s | Unique: %s\n",
        $idx->Key_name,
        $idx->Column_name,
        $idx->Non_unique == 0 ? 'YES' : 'NO'
    );
}

echo "\n--- Índices sobre numero_notaria ---\n";
$numeroIndexes = DB::select("SHOW INDEX FROM notarias WHERE Column_name = 'numero_notaria'");

if (count($numeroIndexes) > 0) {
    foreach ($numeroIndexes as $idx) {
        echo "  ✓ {$idx->Key_name} (Unique: ".($idx->Non_unique == 0 ? 'YES' : 'NO').")\n";
    }
} else {
    echo "  ⚠️  No se encontraron índices sobre numero_notaria\n";
}

echo "\n==================================================\n";
