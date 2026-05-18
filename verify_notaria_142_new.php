<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== VERIFICACION NOTARIA 142 EN SISTEMA NUEVO ===\n\n";

// Primero verificar si existe la notaría
echo "1. Verificando si existe Notaria 142...\n";
$notaria = DB::table('notarias')->where('numero_notaria', '142')->first();
if ($notaria) {
    echo "   ENCONTRADA - ID: {$notaria->id}, Nombre: {$notaria->nombre}\n";
    $notariaId = $notaria->id;
} else {
    echo "   NO ENCONTRADA en tabla notarias\n";
    $notariaId = null;
}
echo "\n";

// Buscar en tabla busquedas
echo "2. Tabla: busquedas\n";
if ($notariaId) {
    $busquedas = DB::table('busquedas')
        ->where('notaria_id', $notariaId)
        ->get();
    echo '   Total registros: '.$busquedas->count()."\n";

    if ($busquedas->count() > 0) {
        echo "   Primeros 5 registros:\n";
        foreach ($busquedas->take(5) as $reg) {
            echo "   - ID: {$reg->id}";
            if (isset($reg->tipo)) {
                echo " | Tipo: {$reg->tipo}";
            }
            if (isset($reg->rfc)) {
                echo " | RFC: {$reg->rfc}";
            }
            if (isset($reg->nombre)) {
                echo " | Nombre: {$reg->nombre}";
            }
            if (isset($reg->created_at)) {
                echo " | Fecha: {$reg->created_at}";
            }
            echo "\n";
        }
    }
} else {
    echo "   No se puede buscar sin ID de notaria\n";
}
echo "\n";

// Buscar en tabla service_usage
echo "3. Tabla: service_usage\n";
if ($notariaId) {
    $usage = DB::table('service_usage')
        ->where('notaria_id', $notariaId)
        ->get();
    echo '   Total registros: '.$usage->count()."\n";

    if ($usage->count() > 0) {
        echo "   Primeros 5 registros:\n";
        foreach ($usage->take(5) as $reg) {
            echo "   - ID: {$reg->id}";
            if (isset($reg->service_id)) {
                echo " | Service ID: {$reg->service_id}";
            }
            if (isset($reg->quantity)) {
                echo " | Cantidad: {$reg->quantity}";
            }
            if (isset($reg->consumed_at)) {
                echo " | Fecha: {$reg->consumed_at}";
            }
            echo "\n";
        }

        // Estadísticas por servicio
        echo "\n   Estadísticas por servicio:\n";
        $stats = DB::table('service_usage')
            ->join('services', 'service_usage.service_id', '=', 'services.id')
            ->where('service_usage.notaria_id', $notariaId)
            ->select('services.name', 'services.code', DB::raw('COUNT(*) as total'), DB::raw('SUM(quantity) as total_quantity'))
            ->groupBy('services.id', 'services.name', 'services.code')
            ->get();

        foreach ($stats as $stat) {
            echo "   - {$stat->code} ({$stat->name}): {$stat->total} registros, {$stat->total_quantity} unidades\n";
        }
    }
} else {
    echo "   No se puede buscar sin ID de notaria\n";
}
echo "\n";

echo "=== RESUMEN ===\n";
if ($notariaId) {
    $totalBusquedas = DB::table('busquedas')->where('notaria_id', $notariaId)->count();
    $totalUsage = DB::table('service_usage')->where('notaria_id', $notariaId)->count();
    echo "Notaría encontrada: SI (ID: {$notariaId})\n";
    echo "Total en 'busquedas': {$totalBusquedas}\n";
    echo "Total en 'service_usage': {$totalUsage}\n";
} else {
    echo "Notaría 142: NO ENCONTRADA en el sistema\n";
}
