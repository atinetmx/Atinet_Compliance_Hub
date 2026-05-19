<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

// Ultimas entradas en tbl_log_general
echo '=== tbl_log_general ultimas 10 ==='.PHP_EOL;
$rows = $pdo->query(
    'SELECT Id, Estatus, Operacion, Descripcion, Datos, Usuario_Id, Fecha_Creacion FROM tbl_log_general ORDER BY Id DESC LIMIT 10'
)->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
}
$lastId = $rows[0]['Id'] ?? 0;

// Probar login con notaria=11 y notaria=1
echo PHP_EOL.'=== Tests ==='.PHP_EOL;
$tests = [
    ['usuario' => 'ADMIN', 'contrasena' => '1010',       'notaria' => '11', 'equipo' => 'test'],
    ['usuario' => 'ADMIN', 'contrasena' => '1010',       'notaria' => '1',  'equipo' => 'test'],
    ['usuario' => 'ADMIN', 'contrasena' => 'ADMIN',      'notaria' => '11', 'equipo' => 'test'],
    ['usuario' => 'ADMIN', 'contrasena' => 'ADMIN',      'notaria' => '1',  'equipo' => 'test'],
];
foreach ($tests as $t) {
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($t),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    $d = json_decode($resp, true);
    $msg = $d['message'] ?? substr($resp, 0, 100);
    $token = ! empty($d['dataResponse']['accessToken']) ? ' >>> TOKEN OK' : '';
    echo "{$t['usuario']}/{$t['contrasena']}/notaria={$t['notaria']}: {$msg}{$token}".PHP_EOL;
}

// Nuevas entradas en log_general
sleep(1);
echo PHP_EOL.'=== Nuevas entradas en tbl_log_general ==='.PHP_EOL;
$new = $pdo->query(
    "SELECT Id, Estatus, Operacion, Descripcion, Datos, Usuario_Id FROM tbl_log_general WHERE Id > {$lastId} ORDER BY Id"
)->fetchAll(PDO::FETCH_ASSOC);
if (empty($new)) {
    echo '(ninguna - C# no logueó nada nuevo)'.PHP_EOL;
} else {
    foreach ($new as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
    }
}
