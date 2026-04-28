<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$url = rtrim(config('services.control_notarial.internal_url'), '/').'/Login/Authentication';

// Usuarios a probar: [cn_usuario_id, descripcion]
$casos = [
    [9,  'SUPERUSUARIO (super_admin, sin notaría)'],
    [4,  'ELIZABETH.ORTEGA (admin_notaria 10)'],
];

foreach ($casos as [$cnId, $desc]) {
    $cnUser = DB::table('tbl_cat_usuarios')->where('Id', $cnId)->first();
    $laravelUser = DB::table('users')->where('cn_usuario_id', $cnId)->first();

    if (! $laravelUser?->cn_password) {
        echo "❌ {$desc}: sin cn_password\n";

        continue;
    }

    try {
        $plainPassword = decrypt($laravelUser->cn_password);
    } catch (\Throwable $e) {
        echo "❌ {$desc}: no se pudo descifrar - {$e->getMessage()}\n";

        continue;
    }

    // Resetear sesión antes
    DB::table('tbl_cat_usuarios')->where('Id', $cnId)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $cnId)->delete();

    $r = Http::withoutVerifying()->timeout(10)->post($url, [
        'usuario' => $cnUser->Usuario,
        'contrasena' => $plainPassword,
        'nombre_Notaria' => 'NOTARIA',
        'equipo' => 'test',
    ]);

    echo "\n[{$desc}]\n";
    echo '  HTTP: '.$r->status()."\n";

    $body = $r->json();
    $token = $body['dataResponse']['accessToken'] ?? null;

    if ($token) {
        // Decodificar JWT sin verificar firma
        $parts = explode('.', $token);
        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        echo "  JWT claims:\n";
        foreach ($payload as $k => $v) {
            echo "    {$k}: {$v}\n";
        }
    } else {
        echo '  Respuesta: '.json_encode($body)."\n";
    }
}

echo "\nListo.\n";
