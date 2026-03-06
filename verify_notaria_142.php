<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== VERIFICACION DE BUSQUEDAS NOTARIA 142 ===\n\n";

// Tabla atinet65_aplicativos
echo "Tabla: atinet65_aplicativos\n";
$aplicativos = DB::table('atinet65_aplicativos')
    ->where('notaria', 'LIKE', '%142%')
    ->orWhere('notaria', '142')
    ->get();
echo "Total registros: " . $aplicativos->count() . "\n";
if ($aplicativos->count() > 0) {
    echo "Primeros 5 registros:\n";
    foreach ($aplicativos->take(5) as $reg) {
        echo "  - ID: {$reg->id} | Notaria: {$reg->notaria}";
        if (isset($reg->fecha)) echo " | Fecha: {$reg->fecha}";
        if (isset($reg->nombre)) echo " | Nombre: {$reg->nombre}";
        echo "\n";
    }
}
echo "\n";

// Tabla atinet65_listasofac
echo "Tabla: atinet65_listasofac\n";
$ofac = DB::table('atinet65_listasofac')
    ->where('notaria', 'LIKE', '%142%')
    ->orWhere('notaria', '142')
    ->get();
echo "Total registros: " . $ofac->count() . "\n";
if ($ofac->count() > 0) {
    echo "Primeros 5 registros:\n";
    foreach ($ofac->take(5) as $reg) {
        echo "  - ID: {$reg->id} | Notaria: {$reg->notaria}";
        if (isset($reg->fecha)) echo " | Fecha: {$reg->fecha}";
        if (isset($reg->nombre)) echo " | Nombre: {$reg->nombre}";
        echo "\n";
    }
}
echo "\n";

// Tabla atinet65_listassat
echo "Tabla: atinet65_listassat\n";
$sat = DB::table('atinet65_listassat')
    ->where('notaria', 'LIKE', '%142%')
    ->orWhere('notaria', '142')
    ->get();
echo "Total registros: " . $sat->count() . "\n";
if ($sat->count() > 0) {
    echo "Primeros 5 registros:\n";
    foreach ($sat->take(5) as $reg) {
        echo "  - ID: {$reg->id} | Notaria: {$reg->notaria}";
        if (isset($reg->fecha)) echo " | Fecha: {$reg->fecha}";
        if (isset($reg->rfc)) echo " | RFC: {$reg->rfc}";
        echo "\n";
    }
}
echo "\n";

// Total general
$total = $aplicativos->count() + $ofac->count() + $sat->count();
echo "TOTAL GENERAL: {$total} registros encontrados\n";
echo "\n";

// Detalle por tabla
echo "=== RESUMEN ===\n";
echo "atinet65_aplicativos: {$aplicativos->count()}\n";
echo "atinet65_listasofac: {$ofac->count()}\n";
echo "atinet65_listassat: {$sat->count()}\n";
