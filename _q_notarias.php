<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$rows = DB::table('notarias')->select('id', 'nombre', 'numero_notaria', 'tenant_db_name', 'telefono', 'direccion', 'municipio', 'estado', 'codigo_postal', 'contacto_principal')->orderBy('id')->get();
foreach ($rows as $r) {
    echo "ID={$r->id} | N°={$r->numero_notaria} | Nombre={$r->nombre} | DB={$r->tenant_db_name}\n";
    echo "       Contacto={$r->contacto_principal} | Tel={$r->telefono} | {$r->municipio}, {$r->estado} {$r->codigo_postal}\n";
}
