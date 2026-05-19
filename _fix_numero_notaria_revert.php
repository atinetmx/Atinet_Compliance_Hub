<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

// El C# usa el campo "notaria" del request directamente como Numero_Notaria.
// Nosotros mandamos notaria='11' (id de ATINET MASTER).
// Por eso ADMIN y SUPERUSUARIO deben tener Numero_Notaria='11'.
$upd = $pdo->prepare('UPDATE tbl_cat_usuarios SET Numero_Notaria=? WHERE Id=?');
$upd->execute(['11', 1]);  // ADMIN
$upd->execute(['11', 9]);  // SUPERUSUARIO

// Verificar
$rows = $pdo->query('SELECT Id, Usuario, Numero_Notaria, LEFT(Contrasena,7) as prefix FROM tbl_cat_usuarios WHERE Id IN (1,9)')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r).PHP_EOL;
}

echo PHP_EOL.'=== Prueba C# con notaria=11 ==='.PHP_EOL;

function testCN(string $label, array $payload): void
{
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 6,
    ]);
    $r = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    $d = json_decode($r, true);
    $msg = $d['message'] ?? ($d['title'] ?? substr($r, 0, 100));
    $token = $d['dataResponse']['accessToken'] ?? null;
    echo "[$label] HTTP {$info['http_code']}: $msg".($token ? ' >>> TOKEN OK' : '').PHP_EOL;
}

// C# usa request.notaria como Numero_Notaria → debe coincidir con tbl_cat_usuarios.Numero_Notaria
testCN('ADMIN/1010/notaria=11', ['usuario' => 'ADMIN',        'contrasena' => '1010',       'notaria' => '11', 'equipo' => 'Laravel-Server']);
testCN('SUPERUSUARIO/pasword123/n=11', ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => '11', 'equipo' => 'Laravel-Server']);
testCN('ADMIN/ADMIN/notaria=11', ['usuario' => 'ADMIN',        'contrasena' => 'ADMIN',       'notaria' => '11', 'equipo' => 'Laravel-Server']);
