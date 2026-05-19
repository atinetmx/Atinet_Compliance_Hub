<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$hashes = array_map('trim', file(__DIR__.'/_h.txt'));
$h1010 = $hashes[0]; // hash('1010')
$hSuper = $hashes[1]; // hash('pasword123')

echo "hash(1010):       $h1010".PHP_EOL;
echo "hash(pasword123): $hSuper".PHP_EOL.PHP_EOL;

// Actualizar hashes generados directamente con BCrypt.Net-Core.dll
$pdo->prepare('UPDATE tbl_cat_usuarios SET Contrasena=? WHERE Id=1')->execute([$h1010]);
$pdo->prepare('UPDATE tbl_cat_usuarios SET Contrasena=? WHERE Id=9')->execute([$hSuper]);
$pdo->prepare('UPDATE tbl_cat_usuarios SET Contrasena=? WHERE Id=18')->execute([$h1010]);

echo 'Hashes actualizados en BD.'.PHP_EOL.PHP_EOL;

// Verificar
$rows = $pdo->query('SELECT Id, Usuario, Numero_Notaria, LEFT(Contrasena,15) as hash FROM tbl_cat_usuarios WHERE Id IN (1,9,18)')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r).PHP_EOL;
}

echo PHP_EOL.'=== Test login C# ==='.PHP_EOL;
$tests = [
    ['usuario' => 'ADMIN',        'contrasena' => '1010',       'notaria' => '11', 'equipo' => 'test'],
    ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => '11', 'equipo' => 'test'],
    ['usuario' => 'LARAVEL_GW',   'contrasena' => '1010',       'notaria' => '11', 'equipo' => 'test'],
];
foreach ($tests as $t) {
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($t), CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5]);
    $resp = curl_exec($ch);
    curl_close($ch);
    $d = json_decode($resp, true);
    $msg = $d['message'] ?? substr($resp, 0, 100);
    $tok = ! empty($d['dataResponse']['accessToken']) ? ' >>> TOKEN OK' : '';
    echo "{$t['usuario']}/{$t['contrasena']}: {$msg}{$tok}".PHP_EOL;
}
