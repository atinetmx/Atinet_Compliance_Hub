<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "==================================================\n";
echo "Configurando Legacy Identifier para Notaría 10 Cuernavaca\n";
echo "==================================================\n\n";

// Buscar notaría
$notaria = App\Models\Notaria::find(3);

if (! $notaria) {
    echo "❌ Notaría con ID 3 no encontrada\n";
    exit(1);
}

echo "📋 Notaría actual:\n";
echo "   ID: {$notaria->id}\n";
echo "   Nombre: {$notaria->nombre}\n";
echo '   Legacy ID actual: '.($notaria->legacy_identifier ?? 'NULL')."\n\n";

// Actualizar legacy_identifier
$legacyId = '10Cuernavaca';

try {
    $notaria->legacy_identifier = $legacyId;
    $notaria->save();

    echo "✅ Legacy identifier actualizado a: {$legacyId}\n\n";

    // Verificar datos legacy en BD aplicativos
    echo "--- Verificando datos en BD Legacy (aplicativos) ---\n";

    $stats = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('notaria', $legacyId)
        ->selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN fuente = "OFAC" THEN 1 ELSE 0 END) as ofac,
            SUM(CASE WHEN fuente = "SAT" THEN 1 ELSE 0 END) as sat,
            MIN(fecha) as primera_busqueda,
            MAX(fecha) as ultima_busqueda
        ')
        ->first();

    if ($stats->total > 0) {
        echo "✅ Datos legacy encontrados:\n";
        echo '   Total búsquedas: '.number_format($stats->total)."\n";
        echo '   - OFAC: '.number_format($stats->ofac)."\n";
        echo '   - SAT: '.number_format($stats->sat)."\n";
        echo "   Primera búsqueda: {$stats->primera_busqueda}\n";
        echo "   Última búsqueda: {$stats->ultima_busqueda}\n\n";

        // Mostrar ejemplos de búsquedas
        echo "📝 Ejemplos de búsquedas (primeras 5):\n";
        $ejemplos = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('notaria', $legacyId)
            ->orderBy('fecha', 'desc')
            ->limit(5)
            ->get(['id', 'fecha', 'fuente', 'nombre_buscado', 'resultado']);

        foreach ($ejemplos as $ej) {
            echo "   [{$ej->id}] {$ej->fecha} | {$ej->fuente} | {$ej->nombre_buscado} | "
                .($ej->resultado ?: 'Sin resultado')."\n";
        }

    } else {
        echo "⚠️  No se encontraron búsquedas para '{$legacyId}' en la BD legacy\n";
        echo "   Verifica que el identificador sea correcto.\n";
    }

} catch (Exception $e) {
    echo '❌ Error: '.$e->getMessage()."\n";
    exit(1);
}

echo "\n==================================================\n";
echo "✅ Configuración completada\n";
echo "Ahora puedes verificar en: http://localhost/admin/notarias/3\n";
echo "==================================================\n";
