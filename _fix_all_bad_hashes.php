<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$rows = DB::table('tbl_cat_usuarios')->get(['Id','Usuario','Contrasena']);
$bad = [];
foreach ($rows as $r) {
    $prefix = substr($r->Contrasena, 0, 4);
    if ($prefix !== '$2b$') {
        $bad[] = $r;
        echo "BAD  Id={$r->Id} Usuario={$r->Usuario} hash=" . substr($r->Contrasena, 0, 10) . "...\n";
    }
}

if (empty($bad)) {
    echo "Todos los hashes son \$2b\$ — OK\n";
    exit(0);
}

echo "\nAplicando fix a " . count($bad) . " usuarios...\n";
foreach ($bad as $r) {
    // Obtener contraseña plain de users.cn_password
    $laravelUser = DB::table('users')->where('cn_usuario_id', $r->Id)->first();
    if (!$laravelUser || !$laravelUser->cn_password) {
        echo "  Id={$r->Id} SIN usuario Laravel asociado — skip\n";
        continue;
    }
    try {
        $plain = decrypt($laravelUser->cn_password);
    } catch (Exception $e) {
        echo "  Id={$r->Id} Error decrypt: {$e->getMessage()} — skip\n";
        continue;
    }

    $hash2b = str_replace('$2y$', '$2b$', password_hash($plain, PASSWORD_BCRYPT, ['cost' => 10]));
    DB::table('tbl_cat_usuarios')->where('Id', $r->Id)->update(['Contrasena' => $hash2b]);

    // Verificar con C#
    $response = Http::withoutVerifying()->timeout(10)->post('http://192.168.1.1:5000/api/Login/Authentication', [
        'usuario'        => $r->Usuario,
        'contrasena'     => $plain,
        'nombre_Notaria' => 'NOTARIA',
        'equipo'         => 'Laravel-Fix',
    ]);
    $body = $response->json();
    $ok = isset($body['dataResponse']['accessToken']);
    echo "  Id={$r->Id} {$r->Usuario} / '{$plain}' → " . ($ok ? 'JWT OK ✓' : 'FALLO: '.($body['message']??'')) . "\n";
}
