<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$cnId    = 9;
$newPass = '1010';

// Obtener hash con PHP ($2y$10$) y cambiar prefijo a $2b (idéntico, BCrypt.Net lo acepta)
$hash2y = password_hash($newPass, PASSWORD_BCRYPT, ['cost' => 10]);
$hash2b = str_replace('$2y$', '$2b$', $hash2y);

echo "Hash generado (2b): {$hash2b}\n";

// Verificar que PHP también puede verificarlo con el prefijo 2b
$verifyPHP = password_verify($newPass, $hash2b);
echo "Verificación PHP con \$2b: " . ($verifyPHP ? 'OK' : 'FALLO') . "\n";

// Actualizar en MySQL
DB::table('tbl_cat_usuarios')->where('Id', $cnId)->update(['Contrasena' => $hash2b]);
echo "Hash actualizado en MySQL para Id={$cnId}\n";

// Probar login con C#
sleep(1);
echo "\nProbando login C# con SUPERUSUARIO / {$newPass}...\n";
$response = Http::withoutVerifying()->timeout(10)->post('http://192.168.1.1:5000/api/Login/Authentication', [
    'usuario'        => 'SUPERUSUARIO',
    'contrasena'     => $newPass,
    'nombre_Notaria' => 'NOTARIA',
    'equipo'         => 'Laravel-Diag',
]);
$body = $response->json();
echo "HTTP: {$response->status()}\n";
echo "message: " . ($body['message'] ?? 'n/a') . "\n";
$ok = isset($body['dataResponse']['accessToken']);
echo "JWT: " . ($ok ? 'OK ✓' : 'FALLO') . "\n";
