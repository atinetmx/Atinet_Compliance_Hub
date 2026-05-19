<?php

// Try simplest possible password with no special chars
$passwords = ['Atinet123', 'AtinетGW123', 'LaravelGW123', 'gateway123'];
$testPass = 'Atinet123';  // No special chars at all

$phpHash = password_hash($testPass, PASSWORD_BCRYPT, ['cost' => 10]);
$hash2b = '$2b$10$'.substr($phpHash, 7);
echo "Setting password: {$testPass}\nHash: {$hash2b}\n\n";

$pdo101 = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
$pdo101->prepare("UPDATE tbl_cat_usuarios SET Contrasena=?, Sesion_Iniciada=0 WHERE Usuario='LARAVEL_GW'")->execute([$hash2b]);
$stored = $pdo101->query("SELECT Contrasena FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW'")->fetchColumn();
echo "Stored in DB:  {$stored}\n";
echo 'Hashes match:  '.($stored === $hash2b ? 'YES' : 'NO')."\n";
echo 'PHP verify:    '.(password_verify($testPass, str_replace('$2b$', '$2y$', $stored)) ? 'YES' : 'NO')."\n\n";

echo "=== Testing login with '{$testPass}' ===\n";
$payload = json_encode(['notaria' => '10', 'usuario' => 'LARAVEL_GW', 'contrasena' => $testPass, 'equipo' => 'Laravel-Test', 'model' => 'PC']);
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json; charset=utf-8'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$body = json_decode($resp, true);
$token = $body['token'] ?? $body['Token'] ?? ($body['dataResponse']['accessToken'] ?? ($body['dataResponse']['token'] ?? null));
echo "HTTP {$code}: ".($token ? '✅ TOKEN: '.substr($token, 0, 80) : '❌ '.($body['message'] ?? $resp))."\n";
echo 'Full: '.json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
