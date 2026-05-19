<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::find(23);
echo "User: {$user->name} | cn_usuario_id antes: ".($user->cn_usuario_id ?? 'NULL').PHP_EOL;

// Verificar tbl_cat_usuarios en tenant antes
$notaria = $user->notaria;
echo "Notaria: {$notaria->nombre} | tenant DB: {$notaria->tenantDatabaseName()}".PHP_EOL;

$connKey = 'cn_tenant_'.$notaria->id;
Illuminate\Support\Facades\Config::set("database.connections.{$connKey}", [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => $notaria->tenantDatabaseName(),
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => false,
]);

$before = Illuminate\Support\Facades\DB::connection($connKey)->table('tbl_cat_usuarios')->count();
echo "tbl_cat_usuarios tenant ANTES: {$before} registros".PHP_EOL;

// Invocar el observer
app(App\Observers\UserObserver::class)->created($user);

$user->refresh();
echo 'cn_usuario_id DESPUÉS: '.($user->cn_usuario_id ?? 'NULL').PHP_EOL;

$after = Illuminate\Support\Facades\DB::connection($connKey)->table('tbl_cat_usuarios')->count();
echo "tbl_cat_usuarios tenant DESPUÉS: {$after} registros".PHP_EOL;

if ($user->cn_usuario_id) {
    $row = Illuminate\Support\Facades\DB::connection($connKey)
        ->table('tbl_cat_usuarios')
        ->where('Id', $user->cn_usuario_id)
        ->first();
    echo 'Registro en tbl_cat_usuarios: '.json_encode($row, JSON_UNESCAPED_UNICODE).PHP_EOL;
}
