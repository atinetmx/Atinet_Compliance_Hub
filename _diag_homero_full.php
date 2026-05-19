<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// 1. Datos del usuario en Laravel
$user = DB::table('users')->where('id', 23)->first();
echo '=== USUARIO LARAVEL (id=23) ==='.PHP_EOL;
echo "name:           {$user->name}".PHP_EOL;
echo "notaria_id:     {$user->notaria_id}".PHP_EOL;
echo "cn_usuario_id:  {$user->cn_usuario_id}".PHP_EOL;
echo 'cn_password:    '.decrypt($user->cn_password).PHP_EOL;

// 2. Notaría en Laravel
$notaria = DB::table('notarias')->where('id', $user->notaria_id)->first();
echo PHP_EOL."=== NOTARIA (id={$user->notaria_id}) ===".PHP_EOL;
echo "numero_notaria:  {$notaria->numero_notaria}".PHP_EOL;
echo "tenant_db_name:  {$notaria->tenant_db_name}".PHP_EOL;

// 3. Conectar al tenant REAL derivado de la notaría del usuario
Config::set('database.connections.tenant_diag', [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => $notaria->tenant_db_name,
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => false,
]);

// 4. tbl_cfg_notaria en el tenant (ID que usa C# internamente)
echo PHP_EOL."=== tbl_cfg_notaria EN TENANT ({$notaria->tenant_db_name}) ===".PHP_EOL;
$cfgRows = DB::connection('tenant_diag')->table('tbl_cfg_notaria')->get();
foreach ($cfgRows as $r) {
    print_r((array) $r);
}

// 5. Usuario CN en el tenant por cn_usuario_id del master
echo PHP_EOL."=== USUARIO CN en master (Id={$user->cn_usuario_id}) ===".PHP_EOL;
$cnMaster = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->first(['Id', 'Usuario', 'Nombre', 'Contrasena']);
print_r((array) $cnMaster);

// 6. Todos los usuarios en el tenant
echo PHP_EOL.'=== TODOS tbl_cat_usuarios EN TENANT ==='.PHP_EOL;
$tenantUsers = DB::connection('tenant_diag')->table('tbl_cat_usuarios')->get(['Id', 'Usuario', 'Nombre', 'Contrasena']);
foreach ($tenantUsers as $r) {
    $hash = str_replace('$2b$', '$2y$', $r->Contrasena ?? '');
    $plain = decrypt($user->cn_password);
    $match = password_verify($plain, $hash) ? 'SI' : 'NO';
    echo "Id={$r->Id} Usuario={$r->Usuario} coincide_con_cn_password={$match}".PHP_EOL;
}
