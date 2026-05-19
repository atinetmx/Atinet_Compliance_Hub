<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Notarías con tbl_cat_roles vacía: #100 (id=9) y #101 (id=10)
$notarias = App\Models\Notaria::whereIn('numero_notaria', ['100', '101'])->get();

$roles = Illuminate\Support\Facades\DB::table('tbl_cat_roles')->get();
echo 'Roles en master: '.count($roles).PHP_EOL;

foreach ($notarias as $notaria) {
    $dbName = $notaria->tenantDatabaseName();
    echo PHP_EOL."Procesando {$dbName}...".PHP_EOL;

    foreach ($roles as $role) {
        $sql = "INSERT INTO `{$dbName}`.`tbl_cat_roles`
                (`Id`, `Nombre`, `Descripcion`, `Activo`, `Fecha_Creacion`)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `Nombre` = VALUES(`Nombre`),
                    `Descripcion` = VALUES(`Descripcion`),
                    `Activo` = VALUES(`Activo`)";

        Illuminate\Support\Facades\DB::statement($sql, [
            $role->Id,
            $role->Nombre,
            $role->Descripcion,
            $role->Activo,
            $role->Fecha_Creacion,
        ]);
    }

    $connKey = 'cn_tenant_backfill_'.$notaria->id;
    Illuminate\Support\Facades\Config::set("database.connections.{$connKey}", [
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
    $count = Illuminate\Support\Facades\DB::connection($connKey)->table('tbl_cat_roles')->count();
    echo "  tbl_cat_roles ahora: {$count} registros ✅".PHP_EOL;
}

// Ahora re-intentar sync del observer para el admin de notaria_101 (user id=23)
echo PHP_EOL.'=== Sync observer para admin notaria_101 (user 23) ==='.PHP_EOL;
$user = App\Models\User::find(23);
echo 'cn_usuario_id antes: '.($user->cn_usuario_id ?? 'NULL').PHP_EOL;
app(App\Observers\UserObserver::class)->created($user);
$user->refresh();
echo 'cn_usuario_id después: '.($user->cn_usuario_id ?? 'NULL').PHP_EOL;

if ($user->cn_usuario_id) {
    $connKey2 = 'cn_tenant_10';
    Illuminate\Support\Facades\Config::set("database.connections.{$connKey2}", [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => 'atinet_edomex_notaria_101',
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
        'strict' => false,
    ]);
    $row = Illuminate\Support\Facades\DB::connection($connKey2)
        ->table('tbl_cat_usuarios')
        ->where('Id', $user->cn_usuario_id)
        ->first();
    echo 'Registro en tbl_cat_usuarios tenant:'.PHP_EOL;
    echo json_encode($row, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT).PHP_EOL;
} else {
    // Check error in log
    $logPath = __DIR__.'/storage/logs/laravel.log';
    $lines = file($logPath);
    $last20 = array_slice($lines, -20);
    echo 'Últimas líneas del log:'.PHP_EOL;
    echo implode('', $last20).PHP_EOL;
}
