<?php

/**
 * Reset LARAVEL_GW password to LaravelGateway2026# and test C# login
 */
$newPassword = 'LaravelGateway2026#';
$phpHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
$hash2b = '$2b$10$'.substr($phpHash, 7);

echo "Password: {$newPassword}\n";
echo "Hash: {$hash2b}\n";
echo 'PHP verify: '.(password_verify($newPassword, str_replace('$2b$', '$2y$', $hash2b)) ? 'YES' : 'NO')."\n\n";

$tenants = [
    'atinet_edomex_notaria_11',
    'atinet_edomex_notaria_10',
    'atinet_mor_notaria_10',
    'atinet_oax_notaria_113',
    'atinet_edomex_notaria_60',
    'atinet_edomex_notaria_100',
    'atinet_edomex_notaria_101',
];

foreach ($tenants as $db) {
    try {
        $pdo = new PDO("mysql:host=localhost;port=3307;dbname={$db}", 'atinet_app', 'Atinet2026#Secure');
        $stmt = $pdo->prepare("UPDATE tbl_cat_usuarios SET Contrasena = ?, Sesion_Iniciada = 0 WHERE Usuario = 'LARAVEL_GW'");
        $stmt->execute([$hash2b]);
        echo "✅ {$db}: {$stmt->rowCount()} row(s)\n";
    } catch (Exception $e) {
        echo "❌ {$db}: ".$e->getMessage()."\n";
    }
}

echo "\n=== Test login: notaria=10, LARAVEL_GW ===\n";
$payload = json_encode(['notaria' => '10', 'usuario' => 'LARAVEL_GW', 'contrasena' => $newPassword, 'equipo' => 'Laravel-Test']);
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$body = json_decode($resp, true);
$token = $body['token'] ?? $body['Token'] ?? ($body['dataResponse']['token'] ?? null);
$msg = $body['message'] ?? $resp;
echo "HTTP {$code}: ".($token ? '✅ TOKEN: '.substr($token, 0, 60).'...' : "❌ {$msg}")."\n";
echo 'Raw: '.json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
