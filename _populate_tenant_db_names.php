<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;

$notarias = Notaria::all();
foreach ($notarias as $n) {
    $dbName = $n->tenantDatabaseName(); // Calcula y persiste automáticamente
    echo "  Notaria {$n->numero_notaria} ({$n->nombre}): tenant_db_name = {$dbName}\n";
}
echo "\nListo. ".$notarias->count()." notarías actualizadas.\n";
