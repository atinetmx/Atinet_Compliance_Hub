<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// 1. Generar hash $2b$ correcto para "1010" y actualizar Id=9
$hash2y = password_hash('1010', PASSWORD_BCRYPT, ['cost' => 10]);
$hash2b = str_replace('$2y$', '$2b$', $hash2y);
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Contrasena' => $hash2b]);
echo "Id=9 Contrasena actualizada a: {$hash2b}\n";

// 2. Limpiar sesiones activas de Id=1 y Id=9
DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->whereIn('Usuario_Id', [1, 9])->delete();
echo "Sesion_Iniciada reseteada para Id=1 e Id=9\n";

// 3. Verificar estado final
echo "\n=== Estado final tbl_cat_usuarios Id=1 y Id=9 ===\n";
$rows = DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->get(['Id','Usuario','Correo','Contrasena','Sesion_Iniciada']);
foreach ($rows as $r) {
    echo "Id={$r->Id} | Usuario={$r->Usuario} | Sesion_Iniciada={$r->Sesion_Iniciada} | Contrasena={$r->Contrasena}\n";
}

// 4. Test de login CN para ambos usuarios
echo "\n=== Test login CN ===\n";
$service = app(\App\Services\ControlNotarialApiService::class);
$cnUrl = config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api');

// Test ADMIN (Id=1) con password 1010
try {
    $resp = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(15)
        ->post(rtrim($cnUrl, '/') . '/Login/Authentication', [
            'usuario'        => 'ADMIN',
            'contrasena'     => '1010',
            'nombre_Notaria' => 'NOTARIA',
            'equipo'         => 'Laravel-Server',
        ]);
    $body = $resp->json();
    $token = $body['dataResponse']['accessToken'] ?? $body['token'] ?? null;
    echo "ADMIN/1010: " . ($token ? "JWT OK (" . substr($token, 0, 20) . "...)" : "FALLO: " . json_encode($body)) . "\n";
} catch (\Exception $e) {
    echo "ADMIN/1010: EXCEPCION: " . $e->getMessage() . "\n";
}

// Test ADMIN (Id=9) con password 1010
try {
    $resp2 = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(15)
        ->post(rtrim($cnUrl, '/') . '/Login/Authentication', [
            'usuario'        => 'ADMIN',  // Id=9 también se llama ADMIN segun la tabla
            'contrasena'     => '1010',
            'nombre_Notaria' => 'NOTARIA',
            'equipo'         => 'Laravel-Server',
        ]);
    $body2 = $resp2->json();
    $token2 = $body2['dataResponse']['accessToken'] ?? $body2['token'] ?? null;
    echo "ADMIN(Id=9)/1010: " . ($token2 ? "JWT OK (" . substr($token2, 0, 20) . "...)" : "FALLO: " . json_encode($body2)) . "\n";
} catch (\Exception $e) {
    echo "ADMIN(Id=9)/1010: EXCEPCION: " . $e->getMessage() . "\n";
}

echo "\nSesion_Iniciada tras tests:\n";
$rows2 = DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->get(['Id','Usuario','Sesion_Iniciada']);
foreach ($rows2 as $r) {
    echo "Id={$r->Id} {$r->Usuario} Sesion_Iniciada={$r->Sesion_Iniciada}\n";
}
