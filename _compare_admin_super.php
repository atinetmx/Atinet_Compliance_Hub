<?php

$pass = 'Atinet2026#Secure';
$host = '127.0.0.1';
$port = 3307;
$user = 'atinet_app';

$pdo = new PDO("mysql:host=$host;port=$port;dbname=atinet_compliance_hub", $user, $pass);

// ========================
// 1) Verificar BD separada CN
// ========================
echo '=== 1. BD SEPARADA C#: bd_sistemacontrolnotarial_principal ==='.PHP_EOL;
try {
    $cn = new PDO("mysql:host=$host;port=$port;dbname=bd_sistemacontrolnotarial_principal", $user, $pass);
    echo 'Conexion OK'.PHP_EOL;
    $rows = $cn->query('SELECT Id, Usuario, Numero_Notaria, Activo, Sesion_Iniciada, Tipo, Contrasena FROM tbl_cat_usuarios WHERE Usuario IN ("ADMIN","SUPERUSUARIO") ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
    if (empty($rows)) {
        echo 'ADMIN/SUPERUSUARIO no encontrados. Listando todos:'.PHP_EOL;
        $all = $cn->query('SELECT Id, Usuario, Numero_Notaria, Activo, LEFT(Contrasena,10) as prefix FROM tbl_cat_usuarios ORDER BY Id LIMIT 20')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($all as $r) {
            echo '  '.json_encode($r).PHP_EOL;
        }
    }
    foreach ($rows as $u) {
        $hash = $u['Contrasena'];
        unset($u['Contrasena']);
        echo json_encode($u).PHP_EOL;
        echo "  hash: $hash".PHP_EOL;
        $plain = ($u['Usuario'] === 'ADMIN') ? '1010' : 'pasword123';
        echo "  verify('$plain'): ".(password_verify($plain, str_replace('$2b$', '$2y$', $hash)) ? 'OK' : 'FAIL').PHP_EOL;
    }
} catch (Exception $e) {
    echo 'ERROR: '.$e->getMessage().PHP_EOL;
}

// ========================
// 2) Comparar en atinet_compliance_hub
// ========================
echo PHP_EOL.'=== 2. EN atinet_compliance_hub ==='.PHP_EOL;
$rows = $pdo->query('SELECT Id, Usuario, Numero_Notaria, Activo, Sesion_Iniciada, Tipo, Contrasena FROM tbl_cat_usuarios WHERE Id IN (1,9) ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $u) {
    $hash = $u['Contrasena'];
    unset($u['Contrasena']);
    echo json_encode($u).PHP_EOL;
    echo "  hash: $hash".PHP_EOL;
    $plain = ($u['Usuario'] === 'ADMIN') ? '1010' : 'pasword123';
    echo "  verify('$plain'): ".(password_verify($plain, str_replace('$2b$', '$2y$', $hash)) ? 'OK' : 'FAIL').PHP_EOL;
}

// ========================
// 3) Probar C# con distintas notarias
// ========================
echo PHP_EOL.'=== 3. PRUEBAS DIRECTAS AL C# ==='.PHP_EOL;
$tests = [
    ['usuario' => 'ADMIN',        'contrasena' => '1010',       'notaria' => 0],
    ['usuario' => 'ADMIN',        'contrasena' => '1010',       'notaria' => 1],
    ['usuario' => 'ADMIN',        'contrasena' => '1010',       'notaria' => 11],
    ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => 0],
    ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => 11],
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
    $decoded = json_decode($resp);
    curl_close($ch);
    echo "{$t['usuario']}/{$t['contrasena']}/notaria={$t['notaria']}: ".($decoded->message ?? $resp).PHP_EOL;
}

// ========================
// 4) appsettings.json
// ========================
echo PHP_EOL.'=== 4. appsettings.json ConnectionStrings ==='.PHP_EOL;
$settings = json_decode(file_get_contents('C:\\SCN\\appsettings.json'), true);
foreach ($settings['ConnectionStrings'] ?? [] as $k => $v) {
    echo "  $k: $v".PHP_EOL;
}
