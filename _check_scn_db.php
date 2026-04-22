<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Mostrar estructura completa de la tabla
$cols = DB::select('DESCRIBE tbl_cat_usuarios');
echo "=== Columnas de tbl_cat_usuarios ===\n";
foreach ($cols as $c) {
    echo "  {$c->Field} | {$c->Type} | Null:{$c->Null} | Default:" . ($c->Default ?? 'NULL') . "\n";
}

// Fila completa de ADMIN ID=1
echo "\n=== Fila completa ADMIN ID=1 ===\n";
$admin = DB::table('tbl_cat_usuarios')->where('Id', 1)->first();
foreach ((array) $admin as $k => $v) {
    echo "  $k: $v\n";
}

// LARAVEL_GW
echo "\n=== Fila completa LARAVEL_GW ===\n";
$gw = DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->first();
foreach ((array) $gw as $k => $v) {
    echo "  $k: $v\n";
}

// También probar hash con $2b$10$ (formato original de LARAVEL_GW)
echo "\n=== Test hash $2b$10$ ===\n";
$phpHash = password_hash('LaravelGateway2026#', PASSWORD_BCRYPT, ['cost' => 10]);
$hash2b  = '$2b$10$' . substr($phpHash, 7);
echo "Hash 2b: $hash2b\n";
echo 'Verify: ' . (password_verify('LaravelGateway2026#', $hash2b) ? 'OK' : 'FAIL') . "\n";

// Actualizar LARAVEL_GW con $2b$10$
DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->update(['Contrasena' => $hash2b, 'Sesion_Iniciada' => 0]);
echo "LARAVEL_GW actualizado con \$2b\$10\$\n";

// Test login inmediato
$base = 'http://192.168.1.1:5000/api';
$tests = [
    ['LARAVEL_GW', 'LaravelGateway2026#'],
    ['ADMIN', 'admin'],
    ['ADMIN', '1010'],
];
echo "\n=== Test logins ===\n";
foreach ($tests as [$u, $p]) {
    $ch = curl_init("$base/Login/Authentication");
    curl_setopt_array($ch, [CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['usuario'=>$u,'contrasena'=>$p,'nombre_Notaria'=>'NOTARIA','equipo'=>'Laravel-Test']),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => false]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $body = json_decode($resp, true);
    $token = $body['token'] ?? $body['Token'] ?? null;
    $msg = $body['message'] ?? $resp;
    echo "$u/$p -> HTTP $code | " . ($token ? '✅ TOKEN: ' . substr($token, 0, 50) . '...' : "❌ $msg") . "\n";
    if ($token) {
        // Hacer logout para no dejar sesión abierta
        $ch2 = curl_init("$base/Login/Logout");
        curl_setopt_array($ch2, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>'{}',
            CURLOPT_HTTPHEADER=>['Content-Type: application/json',"Authorization: Bearer $token"],
            CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>5]);
        curl_exec($ch2); curl_close($ch2);
        echo "  -> Logout ejecutado\n";
    }
}

