<?php

/**
 * Prueba exhaustiva del endpoint C# Login/Authentication
 * para identificar por qué ADMIN/1010 (Alex) funciona pero nuestro flow no.
 */
function testLogin(string $label, array $payload): void
{
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
    ]);
    $raw = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    $decoded = json_decode($raw, true);
    $msg = $decoded['message'] ?? $decoded['title'] ?? substr($raw, 0, 120);
    echo "[$label] HTTP {$info['http_code']}: $msg".PHP_EOL;
    // Si hay token, mostrarlo
    if (! empty($decoded['dataResponse']['accessToken'])) {
        echo '  >>> TOKEN OK: '.substr($decoded['dataResponse']['accessToken'], 0, 40).'...'.PHP_EOL;
    }
    if (! empty($decoded['errors'])) {
        foreach ($decoded['errors'] as $k => $v) {
            echo "  ERR $k: ".implode(', ', (array) $v).PHP_EOL;
        }
    }
}

echo '=== TEST 1: Payload exacto que envía nuestro PHP (con equipo, notaria=string) ==='.PHP_EOL;
testLogin('ADMIN/1010/notaria=11/equipo', ['usuario' => 'ADMIN',        'contrasena' => '1010',       'notaria' => '11', 'equipo' => 'Laravel-Server']);
testLogin('SUPER/pasword123/notaria=11/equipo', ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => '11', 'equipo' => 'Laravel-Server']);

echo PHP_EOL.'=== TEST 2: Sin campo equipo ==='.PHP_EOL;
testLogin('ADMIN/1010/notaria=11', ['usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => '11']);
testLogin('ADMIN/1010/notaria=0', ['usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => '0']);
testLogin('ADMIN/1010/notaria=1', ['usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => '1']);

echo PHP_EOL."=== TEST 3: Con campo 'model' (necesario según error C#) ===".PHP_EOL;
// El C# mostró: "model field is required" — probar con model=""
testLogin('ADMIN/model=""', ['modelo' => '', 'usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => '11']);
testLogin('ADMIN/model=obj', ['model' => ['usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => '11']]);

echo PHP_EOL.'=== TEST 4: Numero_Notaria real de ADMIN (checar BD) ==='.PHP_EOL;
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$admin = $pdo->query("SELECT Id, Usuario, Numero_Notaria, LEFT(Contrasena,7) as prefix FROM tbl_cat_usuarios WHERE Usuario='ADMIN'")->fetch(PDO::FETCH_ASSOC);
echo 'ADMIN en DB: '.json_encode($admin).PHP_EOL;
// Probar con el mismo Numero_Notaria que tiene ADMIN en la BD
$nn = $admin['Numero_Notaria'] ?? '0';
testLogin("ADMIN/Numero_Notaria={$nn}", ['usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => $nn, 'equipo' => 'Laravel-Server']);

echo PHP_EOL.'=== TEST 5: Usuarios de tenant (notaria=1) ==='.PHP_EOL;
try {
    $t1 = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', 'Atinet2026#Secure');
    $u = $t1->query('SELECT Id, Usuario, Numero_Notaria, LEFT(Contrasena,7) as prefix FROM tbl_cat_usuarios LIMIT 3')->fetchAll(PDO::FETCH_ASSOC);
    echo 'Usuarios en notaria_11 DB: '.json_encode($u).PHP_EOL;
} catch (\Exception $e) {
    echo 'N/A: '.$e->getMessage().PHP_EOL;
}

// Probar con user de notaria 1
$t1pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', 'Atinet2026#Secure');
$usr = $t1pdo->query('SELECT Id, Usuario, Numero_Notaria FROM tbl_cat_usuarios LIMIT 1')->fetch(PDO::FETCH_ASSOC);
if ($usr) {
    echo "Probando usuario real de tenant notaria_id=1: {$usr['Usuario']}".PHP_EOL;
    testLogin("{$usr['Usuario']}/notaria=1", ['usuario' => $usr['Usuario'], 'contrasena' => 'pasword123', 'notaria' => '1', 'equipo' => 'Laravel-Server']);
}
