<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo '=== Estado actual: usuarios super_admin en tbl_cat_usuarios ==='.PHP_EOL;

// Obtener todos los cn_usuario_id de super_admin
$superCnIds = $pdo->query(
    "SELECT u.cn_usuario_id, u.email FROM users u WHERE u.tipo_cuenta='super_admin' AND u.cn_usuario_id IS NOT NULL"
)->fetchAll(PDO::FETCH_ASSOC);

$ids = implode(',', array_map(fn ($r) => (int) $r['cn_usuario_id'], $superCnIds));

$cnUsers = $pdo->query(
    "SELECT Id, Usuario, Numero_Notaria, Activo, Contrasena FROM tbl_cat_usuarios WHERE Id IN ($ids)"
)->fetchAll(PDO::FETCH_ASSOC);

foreach ($cnUsers as $r) {
    echo "Id={$r['Id']} Usuario={$r['Usuario']} Numero_Notaria={$r['Numero_Notaria']} Activo={$r['Activo']}".PHP_EOL;
    echo "  Hash: {$r['Contrasena']}".PHP_EOL;
}

// ¿Cuántos tienen Numero_Notaria distinto de '1'?
echo PHP_EOL."=== Usuarios super_admin con Numero_Notaria != '1' ===".PHP_EOL;
$wrong = $pdo->query(
    "SELECT Id, Usuario, Numero_Notaria FROM tbl_cat_usuarios WHERE Id IN ($ids) AND Numero_Notaria != '1'"
)->fetchAll(PDO::FETCH_ASSOC);

if (empty($wrong)) {
    echo "Ninguno — todos tienen Numero_Notaria='1' ✓".PHP_EOL;
} else {
    echo count($wrong).' usuarios con valor incorrecto:'.PHP_EOL;
    foreach ($wrong as $r) {
        echo '  '.json_encode($r).PHP_EOL;
    }

    // Corregirlos
    $wrongIds = implode(',', array_map(fn ($r) => (int) $r['Id'], $wrong));
    $affected = $pdo->exec("UPDATE tbl_cat_usuarios SET Numero_Notaria='1' WHERE Id IN ($wrongIds)");
    echo "Corregidos: $affected filas".PHP_EOL;
}

// Test login C#
echo PHP_EOL.'=== Test login C# (notaria=11) ==='.PHP_EOL;
$tests = [
    ['usuario' => 'ADMIN',        'contrasena' => '1010',       'notaria' => '11', 'equipo' => 'test'],
    ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => '11', 'equipo' => 'test'],
    ['usuario' => 'LARAVEL_GW',   'contrasena' => 'Atinet2026#Gateway', 'notaria' => '11', 'equipo' => 'test'],
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
    $token = ! empty($d['dataResponse']['accessToken']) ? ' >>> TOKEN OK' : '';
    echo "{$t['usuario']}/{$t['contrasena']}: {$msg}{$token}".PHP_EOL;
}
