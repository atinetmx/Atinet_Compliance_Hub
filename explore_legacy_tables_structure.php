<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "==================================================\n";
echo "Explorando estructura de tablas legacy\n";
echo "==================================================\n\n";

// 1. busquedas_escritorio
echo "--- Tabla: aplicativos.busquedas_escritorio ---\n";
try {
    $cols = DB::connection('aplicativos')->select('DESCRIBE busquedas_escritorio');
    foreach ($cols as $col) {
        echo "   - {$col->Field} ({$col->Type})\n";
    }

    $count = DB::connection('aplicativos')->table('busquedas_escritorio')
        ->where('NOTARIA', '10Cuernavaca')->count();
    echo '   Total registros 10Cuernavaca: '.number_format($count)."\n";

    if ($count > 0) {
        echo "   Ejemplo:\n";
        $ejemplo = DB::connection('aplicativos')->table('busquedas_escritorio')
            ->where('NOTARIA', '10Cuernavaca')->first();
        foreach ((array) $ejemplo as $key => $value) {
            echo "      {$key}: ".(is_null($value) ? 'NULL' : substr($value, 0, 50))."\n";
        }
    }
} catch (Exception $e) {
    echo '   ❌ Error: '.$e->getMessage()."\n";
}

// 2. listasofac.consultas
echo "\n--- Tabla: ofac.consultas ---\n";
try {
    $cols = DB::connection('ofac')->select('DESCRIBE consultas');
    foreach ($cols as $col) {
        echo "   - {$col->Field} ({$col->Type})\n";
    }

    $count = DB::connection('ofac')->table('consultas')
        ->where('proyecto', '10Cuernavaca')->count();
    echo '   Total registros 10Cuernavaca: '.number_format($count)."\n";

    if ($count > 0) {
        echo "   Ejemplo:\n";
        $ejemplo = DB::connection('ofac')->table('consultas')
            ->where('proyecto', '10Cuernavaca')->first();
        foreach ((array) $ejemplo as $key => $value) {
            echo "      {$key}: ".(is_null($value) ? 'NULL' : substr($value, 0, 50))."\n";
        }
    }
} catch (Exception $e) {
    echo '   ❌ Error: '.$e->getMessage()."\n";
}

// 3. listassat.consultas
echo "\n--- Tabla: sat.consultas ---\n";
try {
    $cols = DB::connection('sat')->select('DESCRIBE consultas');
    foreach ($cols as $col) {
        echo "   - {$col->Field} ({$col->Type})\n";
    }

    $count = DB::connection('sat')->table('consultas')
        ->where('proyecto', '10Cuernavaca')->count();
    echo '   Total registros 10Cuernavaca: '.number_format($count)."\n";

    if ($count > 0) {
        echo "   Ejemplo:\n";
        $ejemplo = DB::connection('sat')->table('consultas')
            ->where('proyecto', '10Cuernavaca')->first();
        foreach ((array) $ejemplo as $key => $value) {
            echo "      {$key}: ".(is_null($value) ? 'NULL' : substr($value, 0, 50))."\n";
        }
    }
} catch (Exception $e) {
    echo '   ❌ Error: '.$e->getMessage()."\n";
}

echo "\n==================================================\n";
