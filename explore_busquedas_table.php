<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "==================================================\n";
echo "Explorando estructura de tabla 'busquedas' en BD aplicativos\n";
echo "==================================================\n\n";

try {
    // Obtener estructura de la tabla
    $columns = DB::connection('aplicativos')
        ->select('DESCRIBE busquedas');

    echo "📋 Columnas de la tabla 'busquedas':\n";
    foreach ($columns as $col) {
        echo "   - {$col->Field} ({$col->Type}) "
            .($col->Null === 'NO' ? 'NOT NULL' : 'NULL')
            .($col->Key ? " [{$col->Key}]" : '')
            ."\n";
    }

    // Contar registros totales
    $total = DB::connection('aplicativos')
        ->table('busquedas')
        ->count();

    echo "\n📊 Total de registros: ".number_format($total)."\n";

    // Verificar valores únicos en columna 'notaria'
    echo "\n📋 Primeros 10 valores de 'notaria':\n";
    $notarias = DB::connection('aplicativos')
        ->table('busquedas')
        ->select('notaria')
        ->distinct()
        ->limit(10)
        ->get();

    foreach ($notarias as $n) {
        $count = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('notaria', $n->notaria)
            ->count();
        echo "   - '{$n->notaria}' → ".number_format($count)." búsquedas\n";
    }

    // Mostrar 3 registros de ejemplo
    echo "\n📝 Registros de ejemplo (primeros 3):\n";
    $ejemplos = DB::connection('aplicativos')
        ->table('busquedas')
        ->limit(3)
        ->get();

    foreach ($ejemplos as $i => $ej) {
        echo "\n   Registro ".($i + 1).":\n";
        foreach ((array) $ej as $key => $value) {
            echo "      {$key}: ".(is_null($value) ? 'NULL' : $value)."\n";
        }
    }

} catch (Exception $e) {
    echo '❌ Error: '.$e->getMessage()."\n";
    exit(1);
}

echo "\n==================================================\n";
