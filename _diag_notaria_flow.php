<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo '=== notarias.id=11 (ATINET MASTER) ==='.PHP_EOL;
$n = $pdo->query('SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias WHERE id=11')->fetch(PDO::FETCH_ASSOC);
echo json_encode($n).PHP_EOL;

echo PHP_EOL.'=== tbl_cat_usuarios ADMIN y SUPERUSUARIO ==='.PHP_EOL;
$rows = $pdo->query('SELECT Id, Usuario, Numero_Notaria, Activo, Tipo FROM tbl_cat_usuarios WHERE Id IN (1,9)')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r).PHP_EOL;
}

echo PHP_EOL.'=== users super_admin ==='.PHP_EOL;
$rows = $pdo->query("SELECT id, email, tipo_cuenta, notaria_id, cn_usuario_id FROM users WHERE tipo_cuenta='super_admin'")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r).PHP_EOL;
}

// El log mas reciente del C# para ver con qué params filtra tbl_cat_usuarios
echo PHP_EOL.'=== Ultimo log stdout C# ==='.PHP_EOL;
$logs = glob('C:\\SCN\\logs\\stdout_*.log');
usort($logs, fn ($a, $b) => filemtime($b) - filemtime($a));
$content = file_get_contents($logs[0]);
// Buscar la ultima ocurrencia del SELECT tbl_cat_usuarios
$lines = explode("\n", $content);
$relevant = [];
foreach ($lines as $line) {
    $l = trim($line);
    if (str_contains($l, 'tbl_cat_usuarios') || str_contains($l, 'Numero_Notaria') || str_contains($l, 'username') || str_contains($l, '__ToString')) {
        $relevant[] = $l;
    }
}
foreach (array_slice($relevant, -20) as $l) {
    echo $l.PHP_EOL;
}

// Probar C# con notaria=1 (numero_notaria de MASTER) y notaria=11 (id de MASTER)
echo PHP_EOL.'=== Pruebas C# ==='.PHP_EOL;
function testCN(string $label, array $payload): void
{
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5]);
    $r = curl_exec($ch);
    curl_close($ch);
    $d = json_decode($r, true);
    echo "[$label]: ".($d['message'] ?? substr($r, 0, 80)).PHP_EOL;
}
// Enviar notaria=id(11) vs notaria=numero_notaria(1)
testCN('ADMIN/1010/notaria=id:11', ['usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => '11', 'equipo' => 'Laravel-Server']);
testCN('ADMIN/1010/notaria=num:1', ['usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => '1', 'equipo' => 'Laravel-Server']);
testCN('SUPER/pasword123/notaria=11', ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => '11', 'equipo' => 'Laravel-Server']);
testCN('SUPER/pasword123/notaria=1', ['usuario' => 'SUPERUSUARIO', 'contrasena' => 'pasword123', 'notaria' => '1', 'equipo' => 'Laravel-Server']);
