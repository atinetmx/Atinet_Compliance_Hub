<?php

/**
 * Analizar mapeo de notarías entre sistema legacy y nuevo
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Análisis de Notarías: Legacy vs Nuevo ===\n\n";

// 1. Notarías únicas en eventos legacy
echo "→ Notarías en aplicativos.agenda (eventos legacy):\n";
$legacyNotarias = DB::connection('aplicativos')
    ->table('agenda')
    ->select('notaria', DB::raw('COUNT(*) as eventos'))
    ->groupBy('notaria')
    ->orderBy('eventos', 'desc')
    ->get();

foreach ($legacyNotarias as $notaria) {
    echo "  {$notaria->notaria}: {$notaria->eventos} eventos\n";
}

echo "\n→ Total de notarías diferentes: ".count($legacyNotarias)."\n\n";

// 2. Notarías en sistema nuevo
echo "→ Notarías en sistema nuevo (tabla notarias):\n";
$newNotarias = DB::table('notarias')
    ->select('id', 'nombre', 'numero_notaria', 'estado', 'legacy_identifier')
    ->orderBy('id')
    ->get();

foreach ($newNotarias as $notaria) {
    $legacy = $notaria->legacy_identifier ?: '(sin mapear)';
    echo "  #{$notaria->id}: {$notaria->nombre} (Notaría {$notaria->numero_notaria}, {$notaria->estado}) → {$legacy}\n";
}

echo "\n→ Total de notarías en sistema nuevo: ".count($newNotarias)."\n";
echo '→ Notarías CON legacy_identifier: '.$newNotarias->whereNotNull('legacy_identifier')->count()."\n";
echo '→ Notarías SIN legacy_identifier: '.$newNotarias->whereNull('legacy_identifier')->count()."\n\n";

// 3. Sugerencias de mapeo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📝 SUGERENCIAS DE MAPEO\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "Notarías legacy sin mapear a sistema nuevo:\n";
$mapped = $newNotarias->whereNotNull('legacy_identifier')->pluck('legacy_identifier')->toArray();
$legacySlugs = $legacyNotarias->pluck('notaria')->toArray();
$unmapped = array_diff($legacySlugs, $mapped);

if (empty($unmapped)) {
    echo "  ✓ Todas las notarías legacy están mapeadas\n";
} else {
    foreach ($unmapped as $slug) {
        $eventos = $legacyNotarias->firstWhere('notaria', $slug)->eventos;
        echo "  - {$slug}: {$eventos} eventos\n";
    }
}

echo "\n";
