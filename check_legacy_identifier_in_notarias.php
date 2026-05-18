<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n";
echo "═══════════════════════════════════════════════════════════════════\n";
echo "  VERIFICAR: ¿Existen notarías con legacy_identifier poblado?     \n";
echo "═══════════════════════════════════════════════════════════════════\n";
echo "\n";

use Illuminate\Support\Facades\DB;

$totalNotarias = DB::table('notarias')->count();
$notariasConLegacy = DB::table('notarias')
    ->whereNotNull('legacy_identifier')
    ->get();

echo "📊 ESTADÍSTICAS:\n";
echo "─────────────────────────────────────────────────────────────────\n";
echo "Total notarías en sistema nuevo: {$totalNotarias}\n";
echo 'Notarías con legacy_identifier: '.$notariasConLegacy->count()."\n";
echo "\n";

if ($notariasConLegacy->isEmpty()) {
    echo "⚠️  PROBLEMA DETECTADO:\n";
    echo "─────────────────────────────────────────────────────────────────\n";
    echo "No hay ninguna notaría con legacy_identifier.\n";
    echo "Por eso no ves la sección de Historial Legacy en Notarias/Show.\n";
    echo "\n";
    echo "El código está implementado pero la condición es:\n";
    echo "  {notaria.legacy_identifier && (...mostrar historial)}\n";
    echo "\n";
    echo "💡 SOLUCIÓN:\n";
    echo "─────────────────────────────────────────────────────────────────\n";
    echo "Necesitas crear notarías con legacy_identifier O actualizar\n";
    echo "notarías existentes con datos del catálogo legacy.\n";
    echo "\n";
} else {
    echo "✅ Notarías con historial legacy:\n";
    echo "─────────────────────────────────────────────────────────────────\n";
    foreach ($notariasConLegacy as $notaria) {
        echo sprintf(
            "ID: %-3d | %-30s | Legacy: %-15s | Búsquedas: %s\n",
            $notaria->id,
            substr($notaria->nombre, 0, 30),
            $notaria->legacy_identifier,
            $notaria->legacy_busquedas_count ?? '0'
        );
    }
    echo "\n";
}

echo "═══════════════════════════════════════════════════════════════════\n";
echo "\n";
