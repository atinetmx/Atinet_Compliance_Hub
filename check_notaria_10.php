<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "==================================================\n";
echo "Verificando Notaría 10 Cuernavaca\n";
echo "==================================================\n\n";

// Buscar notaría
$notaria = App\Models\Notaria::where('numero_notaria', '10')
    ->where(function($q) {
        $q->where('nombre', 'like', '%Cuernavaca%')
          ->orWhere('municipio', 'like', '%Cuernavaca%');
    })
    ->first();

if (!$notaria) {
    echo "❌ Notaría 10 Cuernavaca no encontrada\n";
    echo "\nBuscando todas las notarías con número 10:\n";
    $notarias = App\Models\Notaria::where('numero_notaria', '10')->get();
    foreach ($notarias as $n) {
        echo "  - ID: {$n->id}, Nombre: {$n->nombre}, Municipio: {$n->municipio}\n";
    }
    exit(1);
}

echo "✅ Notaría encontrada\n\n";
echo "ID: {$notaria->id}\n";
echo "Nombre: {$notaria->nombre}\n";
echo "Número: {$notaria->numero_notaria}\n";
echo "Estado: {$notaria->estado}\n";
echo "Municipio: {$notaria->municipio}\n";
echo "CP: {$notaria->codigo_postal}\n";
echo "Legacy Identifier: " . ($notaria->legacy_identifier ?? '❌ NULL') . "\n\n";

if (!$notaria->legacy_identifier) {
    echo "⚠️  ADVERTENCIA: legacy_identifier está vacío\n";
    echo "No se mostrará el historial legacy en la UI\n\n";
} else {
    echo "✅ Legacy identifier configurado correctamente\n";

    // Verificar datos legacy
    try {
        $stats = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('notaria', $notaria->legacy_identifier)
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN fuente = "OFAC" THEN 1 ELSE 0 END) as ofac,
                SUM(CASE WHEN fuente = "SAT" THEN 1 ELSE 0 END) as sat,
                MIN(fecha) as primera_busqueda,
                MAX(fecha) as ultima_busqueda
            ')
            ->first();

        echo "\n--- Estadísticas Legacy ---\n";
        echo "Total búsquedas: " . number_format($stats->total) . "\n";
        echo "  - OFAC: " . number_format($stats->ofac) . "\n";
        echo "  - SAT: " . number_format($stats->sat) . "\n";
        echo "Primera búsqueda: {$stats->primera_busqueda}\n";
        echo "Última búsqueda: {$stats->ultima_busqueda}\n";

    } catch (Exception $e) {
        echo "\n❌ Error al consultar datos legacy:\n";
        echo $e->getMessage() . "\n";
    }
}

echo "\n==================================================\n";
echo "URL para verificar: https://tu-dominio.com/admin/notarias/{$notaria->id}\n";
echo "==================================================\n";
