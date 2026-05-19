<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Hashes generados directamente por BCrypt.Net-Core.dll (mismo DLL que usa C#)
$hashes = [
    1 => '$2b$10$JmuCasIvYszUehk/1kjzAexQke9kGyb0FkMfFKFSPfDR1GUjtWdIC', // ADMIN / 1010
    9 => '$2b$10$/NwiYKL8nejroNfRSSMvYuXG3V.vFz/mQFWRalfZQtMJR0H/bJtiC',  // SUPERUSUARIO / pasword123
    18 => '$2b$10$XgL/M/x8Sc7ny5p2GoaRNuRoLh34OETObpwcobzIUa46auokolfCK',  // LARAVEL_GW / LARAVEL_GW
];

foreach ($hashes as $id => $hash) {
    $stmt = $pdo->prepare('UPDATE tbl_cat_usuarios SET Contrasena=? WHERE Id=?');
    $stmt->execute([$hash, $id]);
    echo "Actualizado Id=$id: ".$stmt->rowCount().' fila'.PHP_EOL;
}

// Verificar desde PHP que los hashes son correctos
$checks = [1 => '1010', 9 => 'pasword123', 18 => 'LARAVEL_GW'];
echo PHP_EOL.'=== Verificación PHP ==='.PHP_EOL;
foreach ($checks as $id => $plain) {
    $stored = $pdo->query("SELECT Contrasena FROM tbl_cat_usuarios WHERE Id=$id")->fetchColumn();
    $ok = password_verify($plain, str_replace('$2b$', '$2y$', $stored));
    echo "Id=$id plain='$plain': ".($ok ? 'OK' : 'FAIL').PHP_EOL;
}

// Test directo al C#
echo PHP_EOL.'=== Test login C# ==='.PHP_EOL;
$tests = [
    ['usuario' => 'ADMIN',        'contrasena' => '1010',       'notaria' => '11', 'equipo' => 'test'],
    ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => '11', 'equipo' => 'test'],
    ['usuario' => 'LARAVEL_GW',   'contrasena' => 'LARAVEL_GW', 'notaria' => '11', 'equipo' => 'test'],
];
foreach ($tests as $t) {
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($t),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 6,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    $d = json_decode($resp, true);
    $msg = $d['message'] ?? substr($resp, 0, 100);
    $extra = ! empty($d['dataResponse']['accessToken']) ? ' >>> TOKEN OK' : '';
    echo "{$t['usuario']}/{$t['contrasena']}/notaria={$t['notaria']}: {$msg}{$extra}".PHP_EOL;
}
