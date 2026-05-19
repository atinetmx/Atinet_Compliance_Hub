<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

// Revertir Numero_Notaria a '11' para ADMIN, SUPERUSUARIO y LARAVEL_GW
$affected = $pdo->exec("UPDATE tbl_cat_usuarios SET Numero_Notaria='11' WHERE Id IN (1,9,18)");
echo "Revertidos a Numero_Notaria='11': $affected filas".PHP_EOL;

// Verificar
$rows = $pdo->query('SELECT Id, Usuario, Numero_Notaria, LEFT(Contrasena,7) as prefix FROM tbl_cat_usuarios WHERE Id IN (1,9,18)')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r).PHP_EOL;
}

// Probar login C#
echo PHP_EOL."=== Test C# con Numero_Notaria='11' ===".PHP_EOL;
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
    $tkn = ! empty($d['dataResponse']['accessToken']) ? ' >>> TOKEN OK' : '';
    echo "{$t['usuario']}/{$t['contrasena']}/notaria={$t['notaria']}: {$msg}{$tkn}".PHP_EOL;
}
