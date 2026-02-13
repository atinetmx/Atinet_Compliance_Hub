<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "📋 Ejemplos de RFCs reales en la base de datos:\n\n";

// SAT 69-B - RFCs
echo "=== SAT 69-B (Personas con RFC) ===\n";
$satRfcs = App\Models\Sat69B::whereNotNull('RFC')
    ->where('RFC', '!=', '')
    ->selectRaw("RFC, replace(NombreOriginal, ',', '') as nombre_limpio")
    ->limit(10)
    ->get();

foreach ($satRfcs as $item) {
    $length = strlen(trim($item->RFC));
    $tipo = $length === 12 ? 'FÍSICA' : ($length === 13 ? 'MORAL' : 'DESCONOCIDO');
    echo "  RFC: {$item->RFC} ({$length} chars - {$tipo})\n";
    echo "      Nombre: {$item->nombre_limpio}\n\n";
}

// Ejemplos específicos de persona física (12 caracteres)
echo "\n=== Ejemplos Persona FÍSICA (12 caracteres) ===\n";
$fisica = App\Models\Sat69B::whereNotNull('RFC')
    ->whereRaw('LENGTH(TRIM(RFC)) = 12')
    ->selectRaw("RFC, replace(NombreOriginal, ',', '') as nombre_limpio")
    ->limit(5)
    ->get();

foreach ($fisica as $item) {
    echo "  RFC: {$item->RFC}\n";
    echo "      Nombre: {$item->nombre_limpio}\n";
}

// Ejemplos específicos de persona moral (13 caracteres)
echo "\n=== Ejemplos Persona MORAL (13 caracteres) ===\n";
$moral = App\Models\Sat69B::whereNotNull('RFC')
    ->whereRaw('LENGTH(TRIM(RFC)) = 13')
    ->selectRaw("RFC, replace(NombreOriginal, ',', '') as nombre_limpio")
    ->limit(5)
    ->get();

foreach ($moral as $item) {
    echo "  RFC: {$item->RFC}\n";
    echo "      Nombre: {$item->nombre_limpio}\n";
}

// Analizar patrones
echo "\n=== Análisis de patrones ===\n";
$total = App\Models\Sat69B::whereNotNull('RFC')->where('RFC', '!=', '')->count();
$con12 = App\Models\Sat69B::whereRaw('LENGTH(TRIM(RFC)) = 12')->count();
$con13 = App\Models\Sat69B::whereRaw('LENGTH(TRIM(RFC)) = 13')->count();
$otros = $total - $con12 - $con13;

echo "  Total RFCs: {$total}\n";
echo "  12 caracteres (física): {$con12}\n";
echo "  13 caracteres (moral): {$con13}\n";
echo "  Otras longitudes: {$otros}\n";
