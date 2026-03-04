<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Configurar conexión a BD tenant
config(['database.connections.tenant_check' => [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => 'atinet_edomex_notaria_1',
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
]]);

echo '=== USUARIO EN BD TENANT ==='.PHP_EOL.PHP_EOL;

$user = DB::connection('tenant_check')->table('users')->where('email', 'leinad@notaria1.com')->first();

if ($user) {
    echo '✅ Usuario encontrado:'.PHP_EOL;
    echo "  Nombre: {$user->name}".PHP_EOL;
    echo "  Email: {$user->email}".PHP_EOL;
    echo "  Tipo: {$user->tipo_cuenta}".PHP_EOL;
    echo PHP_EOL;

    // Probar passwords comunes
    echo '🔑 Probando contraseñas comunes:'.PHP_EOL;

    $commonPasswords = ['password', 'password123', '123456', 'admin123'];

    foreach ($commonPasswords as $pwd) {
        if (password_verify($pwd, $user->password)) {
            echo "  ✅ Password es: '{$pwd}'".PHP_EOL;
            break;
        }
    }
}

echo PHP_EOL.'=== CREDENCIALES DE ACCESO ==='.PHP_EOL;
echo 'URL: http://192.168.1.1:8080'.PHP_EOL;
echo 'Email: leinad@notaria1.com'.PHP_EOL;
echo 'Password: [verificar arriba]'.PHP_EOL;
