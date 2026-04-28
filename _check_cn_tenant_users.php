<?php

/**
 * Diagnóstico: estado de usuarios CN en todos los tenants.
 * Muestra qué tenants tienen usuarios en tbl_cat_usuarios (más allá de LARAVEL_GW).
 */
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

$notarias = Notaria::orderBy('id')->get();

echo "=== Estado de usuarios CN en BDs tenant ===\n\n";

foreach ($notarias as $notaria) {
    $dbName = $notaria->tenantDatabaseName();
    $connName = "cn_diag_{$notaria->id}";

    Config::set("database.connections.{$connName}", [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => $dbName,
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
        'strict' => false,
    ]);

    try {
        $users = DB::connection($connName)
            ->table('tbl_cat_usuarios')
            ->select('Id', 'Usuario', 'Activo')
            ->get();

        $nonGw = $users->filter(fn ($u) => $u->Usuario !== 'LARAVEL_GW');
        echo "Notaria {$notaria->id}: {$notaria->nombre} | DB: {$dbName}\n";
        echo "  Total usuarios: {$users->count()} | No-GW: {$nonGw->count()}\n";
        foreach ($users as $u) {
            $activo = $u->Activo ? 'activo' : 'inactivo';
            echo "    Id={$u->Id} | {$u->Usuario} | {$activo}\n";
        }
    } catch (\Exception $e) {
        echo "Notaria {$notaria->id}: {$notaria->nombre} | ERROR: {$e->getMessage()}\n";
    }
    echo "\n";
}

// Verificar también qué usuarios de Laravel tienen cn_usuario_id mapeado a cada notaria
echo "=== Mapeo Laravel users -> CN IDs por notaria ===\n";
$laravelUsers = \App\Models\User::whereNotNull('cn_usuario_id')
    ->whereNotNull('notaria_id')
    ->with('notaria')
    ->get();

foreach ($laravelUsers as $u) {
    echo "User {$u->id} ({$u->name}) | notaria_id={$u->notaria_id} ({$u->notaria?->nombre}) | cn_usuario_id={$u->cn_usuario_id}\n";
}
