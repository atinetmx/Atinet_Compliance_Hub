<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Storage;

echo "🔍 Verificando notarías que solo usan otros servicios...\n\n";

// Load catalog
$catalogFile = Storage::disk('local')->get('catalogo_notarias_legacy.json');
$catalog = json_decode($catalogFile, true);

$notarias = collect($catalog['notarias']);

// Filter notarías without black list searches
$soloOtrosServicios = $notarias->where('tiene_busquedas_listas_negras', false);

echo "📊 Notarías sin búsquedas en listas negras: {$soloOtrosServicios->count()}\n\n";

if ($soloOtrosServicios->isEmpty()) {
    echo "⚠️ No se encontraron notarías sin búsquedas en listas negras.\n";
    exit(0);
}

// Display details
$table = $soloOtrosServicios->map(function ($item) {
    return [
        'ID' => $item['notaria_id'],
        'Búsquedas' => $item['total_busquedas'] ?? 0,
        'Usuarios' => $item['total_usuarios'] ?? 0,
        'Acceso Web' => $item['tiene_acceso_web'] ? 'Sí' : 'No',
        'Tipo' => $item['tipo'] ?? 'N/A',
        'Estado' => $item['es_activa'] ? 'Activa' : 'Inactiva',
    ];
});

// ASCII table
echo str_repeat('=', 90)."\n";
printf("| %-20s | %-10s | %-8s | %-10s | %-20s | %-10s |\n", 
    'ID', 'Búsquedas', 'Usuarios', 'Acceso Web', 'Tipo', 'Estado'
);
echo str_repeat('=', 90)."\n";

foreach ($table as $row) {
    printf("| %-20s | %-10s | %-8s | %-10s | %-20s | %-10s |\n",
        $row['ID'],
        $row['Búsquedas'],
        $row['Usuarios'],
        $row['Acceso Web'],
        $row['Tipo'],
        $row['Estado']
    );
}
echo str_repeat('=', 90)."\n\n";

// Verify expected notarías
$expected = ['81tulum', '99nogales', 'Corr13Quintanaroo', 'registro'];
$found = $soloOtrosServicios->pluck('notaria_id')->map(fn($id) => strtolower($id));

echo "✓ Verificando notarías esperadas:\n";
foreach ($expected as $notaria) {
    $exists = $found->contains(strtolower($notaria));
    $icon = $exists ? '✅' : '❌';
    echo "  {$icon} {$notaria}: ".($exists ? 'Encontrada' : 'No encontrada')."\n";
}

// Summary
echo "\n📈 Resumen:\n";
echo "  • Total en catálogo: ".number_format($notarias->count())."\n";
echo "  • Con búsquedas en listas negras: ".number_format($notarias->where('tiene_busquedas_listas_negras', true)->count())."\n";
echo "  • Solo otros servicios: ".number_format($soloOtrosServicios->count())."\n";
echo "  • Con acceso web: ".number_format($notarias->where('tiene_acceso_web', true)->count())."\n";
echo "  • Total usuarios: ".number_format($notarias->sum('total_usuarios'))."\n";
