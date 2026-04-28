<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

// Todos los usuarios con cn_usuario_id configurado
$users = User::whereNotNull('cn_usuario_id')->with('notaria')->get();

echo "=== Usuarios con CN configurado ===\n";
foreach ($users as $u) {
    $notariaNombre = $u->notaria?->nombre ?? '(sin notaria)';
    $hasPass = ! empty($u->cn_password) ? 'SI' : 'NO';
    $plain = '';
    if ($u->cn_password) {
        try {
            $plain = decrypt($u->cn_password);
            $plain = substr($plain, 0, 3).'...[len='.strlen($plain).']';
        } catch (\Exception $e) {
            $plain = 'ERR:'.$e->getMessage();
        }
    }
    echo "ID={$u->id} | {$u->name} | notaria_id={$u->notaria_id} | notaria={$notariaNombre} | cn_id={$u->cn_usuario_id} | pass={$hasPass} | plain={$plain}\n";
}

// Verificar qué password tiene NOTARIA60 en la BD CN
echo "\n=== Verificando BD CN para NOTARIA60 ===\n";
$notaria60 = \App\Models\Notaria::where('nombre', 'like', '%60%')
    ->orWhere('nombre', 'like', '%Ecatepec%')
    ->first();

if ($notaria60) {
    echo "Notaria: {$notaria60->nombre} | ID={$notaria60->id}\n";
    echo 'DB tenant: '.$notaria60->tenantDatabaseName()."\n";

    $connName = 'cn_diag_60';
    \Illuminate\Support\Facades\Config::set("database.connections.{$connName}", [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => $notaria60->tenantDatabaseName(),
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
        'strict' => false,
    ]);

    try {
        $cnUsers = \Illuminate\Support\Facades\DB::connection($connName)
            ->table('tbl_cat_usuarios')
            ->select(['Id', 'Usuario', 'Contrasenia'])
            ->get();

        echo "Usuarios en tbl_cat_usuarios ({$notaria60->tenantDatabaseName()}):\n";
        foreach ($cnUsers as $cu) {
            echo "  Id={$cu->Id} | Usuario={$cu->Usuario} | Pass(hash)=".substr($cu->Contrasenia ?? '', 0, 20)."...\n";
        }
    } catch (\Exception $e) {
        echo 'Error al leer BD CN: '.$e->getMessage()."\n";
    }
} else {
    echo "Notaria 60 no encontrada\n";
}
