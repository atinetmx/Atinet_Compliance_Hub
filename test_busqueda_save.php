<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Busqueda;
use App\Models\User;

try {
    echo "=== TEST: Guardar búsqueda en historial ===\n\n";

    // Obtener el primer usuario con notaría
    $user = User::whereHas('notaria')->with('notaria')->first();

    if (! $user) {
        echo "❌ ERROR: No hay usuarios con notaría asociada\n";
        exit(1);
    }

    echo "✓ Usuario encontrado: {$user->name} (ID: {$user->id})\n";
    echo "✓ Notaría: {$user->notaria->nombre} (ID: {$user->notaria->id})\n\n";

    // Verificar que la tabla existe
    $tableExists = \Illuminate\Support\Facades\Schema::hasTable('busquedas');
    if (! $tableExists) {
        echo "❌ ERROR: La tabla 'busquedas' no existe\n";
        echo "Ejecuta: php artisan migrate\n";
        exit(1);
    }
    echo "✓ La tabla 'busquedas' existe\n\n";

    // Verificar columnas
    $columns = \Illuminate\Support\Facades\Schema::getColumnListing('busquedas');
    echo "Columnas en la tabla:\n";
    foreach ($columns as $column) {
        echo "  - $column\n";
    }
    echo "\n";

    // Intentar crear un registro
    echo "Intentando crear registro de búsqueda...\n";

    $busqueda = Busqueda::create([
        'notaria_id' => $user->notaria->id,
        'user_id' => $user->id,
        'tipo_busqueda' => 'TEST',
        'termino_busqueda' => 'Prueba Manual',
        'resultados' => [
            'data' => [
                'ofac' => ['test' => 'data'],
                'sat' => [],
            ],
            'total' => 1,
            'timestamp' => now()->toIso8601String(),
        ],
    ]);

    echo "✓ Registro creado exitosamente!\n";
    echo "  ID: {$busqueda->id}\n";
    echo "  Tipo: {$busqueda->tipo_busqueda}\n";
    echo "  Término: {$busqueda->termino_busqueda}\n";
    echo '  Resultados: '.json_encode($busqueda->resultados)."\n\n";

    // Verificar que se puede leer
    $busquedaLeida = Busqueda::find($busqueda->id);
    if ($busquedaLeida) {
        echo "✓ Registro leído correctamente desde la BD\n\n";
    } else {
        echo "❌ ERROR: No se pudo leer el registro recién creado\n";
        exit(1);
    }

    // Contar registros totales
    $total = Busqueda::count();
    echo "Total de búsquedas en la BD: $total\n\n";

    // Limpiar registro de prueba
    $busqueda->delete();
    echo "✓ Registro de prueba eliminado\n\n";

    echo "=== TEST EXITOSO ===\n";
    echo "La tabla funciona correctamente. El problema puede ser:\n";
    echo "1. El método saveSearchHistory() no se está ejecutando\n";
    echo "2. Hay un error silencioso en el try-catch\n";
    echo "3. Las búsquedas no están llegando al punto donde se guarda el historial\n\n";

    echo "Revisa los logs en storage/logs/laravel.log\n";

} catch (\Exception $e) {
    echo "❌ ERROR: {$e->getMessage()}\n";
    echo "Archivo: {$e->getFile()}:{$e->getLine()}\n";
    echo "\nStack trace:\n{$e->getTraceAsString()}\n";
    exit(1);
}
