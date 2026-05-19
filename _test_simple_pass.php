<?php

// Set a simple test password to confirm BCrypt verification works at all
$testPassword = 'Test1234!';
$hash = password_hash($testPassword, PASSWORD_BCRYPT, ['cost' => 10]);
$hash2b = '$2b$10$'.substr($hash, 7);

echo "Test password: {$testPassword}\n";
echo "Hash (2b): {$hash2b}\n";

// Update only atinet_edomex_notaria_101 for test
$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
$stmt = $pdo->prepare("UPDATE tbl_cat_usuarios SET Contrasena = ?, Sesion_Iniciada = 0 WHERE Usuario = 'LARAVEL_GW'");
$stmt->execute([$hash2b]);
echo "Rows updated: {$stmt->rowCount()}\n\n";
echo 'Current hash in DB: '.$pdo->query("SELECT Contrasena FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW'")->fetchColumn()."\n\n";

// Test with notaria as int (not string)
echo "=== Test notaria as integer 10 ===\n";
$payload = json_encode(['notaria' => 10, 'usuario' => 'LARAVEL_GW', 'contrasena' => $testPassword, 'equipo' => 'Laravel-Test']);
echo "Payload: {$payload}\n";
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$body = json_decode($resp, true);
$msg = $body['message'] ?? $resp;
$token = $body['token'] ?? $body['Token'] ?? ($body['dataResponse']['accessToken'] ?? ($body['dataResponse']['token'] ?? null));
echo "HTTP {$code}: ".($token ? '✅ TOKEN: '.substr($token, 0, 80).'...' : "❌ {$msg}")."\n";
echo 'Full response: '.json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
