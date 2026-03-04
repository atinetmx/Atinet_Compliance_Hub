<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔍 VERIFICACIÓN DE SINCRONIZACIÓN COMPLETA\n";
echo str_repeat('━', 60)."\n\n";

// OFAC - Listar todas las tablas y sus conteos
echo "📋 OFAC (atinet65_listasofac):\n";
$ofacTables = DB::connection('ofac')->select('SHOW TABLES');
$ofacTableKey = 'Tables_in_atinet65_listasofac';
$ofacTotal = 0;

foreach ($ofacTables as $table) {
    $tableName = $table->$ofacTableKey;
    $count = DB::connection('ofac')->table($tableName)->count();
    $ofacTotal += $count;
    echo sprintf("  %-20s → %s registros\n", $tableName, number_format($count));
}
echo sprintf("  %-20s → %s TOTAL\n", 'TOTAL OFAC', number_format($ofacTotal));

echo "\n";

// SAT - Listar todas las tablas y sus conteos
echo "📋 SAT (atinet65_listassat):\n";
$satTables = DB::connection('sat')->select('SHOW TABLES');
$satTableKey = 'Tables_in_atinet65_listassat';
$satTotal = 0;

foreach ($satTables as $table) {
    $tableName = $table->$satTableKey;
    $count = DB::connection('sat')->table($tableName)->count();
    $satTotal += $count;
    echo sprintf("  %-20s → %s registros\n", $tableName, number_format($count));
}
echo sprintf("  %-20s → %s TOTAL\n", 'TOTAL SAT', number_format($satTotal));

echo "\n";

// Aplicativos - Listar todas las tablas y sus conteos
echo "📋 APLICATIVOS (atinet65_aplicativos):\n";
$aplicativosTables = DB::connection('aplicativos')->select('SHOW TABLES');
$aplicativosTableKey = 'Tables_in_atinet65_aplicativos';
$aplicativosTotal = 0;

foreach ($aplicativosTables as $table) {
    $tableName = $table->$aplicativosTableKey;
    $count = DB::connection('aplicativos')->table($tableName)->count();
    $aplicativosTotal += $count;
    echo sprintf("  %-20s → %s registros\n", $tableName, number_format($count));
}
echo sprintf("  %-20s → %s TOTAL\n", 'TOTAL APLICATIVOS', number_format($aplicativosTotal));

echo "\n";
echo str_repeat('━', 60)."\n";
echo sprintf("✅ GRAN TOTAL: %s registros\n", number_format($ofacTotal + $satTotal + $aplicativosTotal));
echo str_repeat('━', 60)."\n";

// Mostrar específicamente 69-C que antes no se sincronizaba
echo "\n🎯 TABLA CRÍTICA - SAT 69-C (antes no sincronizada):\n";
$count69C = DB::connection('sat')->table('69-C')->count();
echo '  Registros actuales: '.number_format($count69C)."\n";

if ($count69C > 0) {
    echo "  ✅ ÉXITO: Tabla 69-C ahora está sincronizada\n";

    // Mostrar algunos registros de ejemplo
    $samples = DB::connection('sat')->table('69-C')->limit(3)->get();
    echo "\n  📝 Muestra de registros (primeros 3):\n";
    foreach ($samples as $sample) {
        $sampleArray = (array) $sample;
        echo '    • '.implode(' | ', array_slice($sampleArray, 0, 3))."\n";
    }
} else {
    echo "  ❌ ERROR: Tabla 69-C sigue vacía\n";
}
