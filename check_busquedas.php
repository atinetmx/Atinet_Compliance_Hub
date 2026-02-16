<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Busqueda;

echo "=== VERIFICACIÓN DE BÚSQUEDAS ===\n\n";

// Contar búsquedas
$total = Busqueda::count();
echo "Total de búsquedas en la BD: $total\n\n";

if ($total > 0) {
    echo "Últimas 5 búsquedas:\n";
    echo str_repeat("=", 80) . "\n";
    
    $ultimas = Busqueda::with(['user', 'notaria'])
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get();
    
    foreach ($ultimas as $busqueda) {
        echo "ID: {$busqueda->id}\n";
        echo "Tipo: {$busqueda->tipo_busqueda}\n";
        echo "Término: {$busqueda->termino_busqueda}\n";
        echo "Usuario: {$busqueda->user->name} (ID: {$busqueda->user_id})\n";
        echo "Notaría: {$busqueda->notaria->nombre} (ID: {$busqueda->notaria_id})\n";
        echo "Fecha: {$busqueda->created_at}\n";
        $total_resultados = $busqueda->resultados['total'] ?? 'N/A';
        echo "Resultados: {$total_resultados}\n";
        echo str_repeat("-", 80) . "\n";
    }
} else {
    echo "⚠️ No hay búsquedas registradas en el historial.\n\n";
    echo "Esto significa que:\n";
    echo "1. El método saveSearchHistory() no se está ejecutando\n";
    echo "2. Las búsquedas fallan antes de llegar a ese punto\n";
    echo "3. Hay un error silencioso que impide el guardado\n\n";
    echo "ACCIÓN: Revisa los logs después de hacer una búsqueda:\n";
    echo "   Get-Content storage\\logs\\laravel.log -Tail 100 | Select-String 'saveSearchHistory'\n";
}

echo "\n";
