<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Mapa de contraseñas conocidas por users.id
$passwords = [
    1 => 'password123', // SUPERUSUARIO
    11 => 'ADMIN',       // ADMIN
    // todos los demás => admin123
];

$rows = $pdo->query('
    SELECT 
        u.id, u.email, u.password as u_hash,
        u.cn_usuario_id,
        c.Id as cn_id, c.Usuario, c.Contrasena as cn_hash,
        n.id as notaria_id
    FROM users u
    LEFT JOIN tbl_cat_usuarios c ON c.Id = u.cn_usuario_id
    LEFT JOIN notarias n ON n.id = u.notaria_id
    ORDER BY u.id
')->fetchAll(PDO::FETCH_ASSOC);

echo "=== VERIFICACION LARAVEL (password_verify contra tabla users) ===\n";
echo str_pad('uid', 5).str_pad('email', 38).str_pad('password', 14)."resultado\n";
echo str_repeat('-', 75)."\n";

$laravel_ok = 0;
$laravel_fail = 0;
foreach ($rows as $r) {
    $pwd = $passwords[$r['id']] ?? 'admin123';
    $ok = password_verify($pwd, $r['u_hash']);
    echo str_pad($r['id'], 5)
       .str_pad($r['email'], 38)
       .str_pad($pwd, 14)
       .($ok ? 'TRUE ✓' : 'FALSE ✗')
       ."\n";
    $ok ? $laravel_ok++ : $laravel_fail++;
}
echo "\nLaravel OK: $laravel_ok | Fallos: $laravel_fail\n\n";

// === C# API ===
echo "=== VERIFICACION C# API (POST /api/Login/Authentication) ===\n";
echo str_pad('uid', 5).str_pad('cn_usuario', 20).str_pad('notaria_id', 12).str_pad('password', 14)."resultado\n";
echo str_repeat('-', 80)."\n";

$api_ok = 0;
$api_fail = 0;

foreach ($rows as $r) {
    if (empty($r['cn_id']) || empty($r['notaria_id'])) {
        echo str_pad($r['id'], 5).str_pad($r['Usuario'] ?? 'N/A', 20).str_pad('-', 12)."SIN notaria_id o cn_usuario — SKIP\n";

        continue;
    }

    $pwd = $passwords[$r['id']] ?? 'admin123';

    $payload = json_encode([
        'usuario' => $r['Usuario'],
        'contrasena' => $pwd,
        'notaria' => (int) $r['notaria_id'],
    ]);

    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    $status = $error ? "CURL_ERROR: $error" : ($httpCode == 200 ? 'HTTP 200 ✓' : "HTTP $httpCode ✗");
    echo str_pad($r['id'], 5)
       .str_pad($r['Usuario'], 20)
       .str_pad($r['notaria_id'], 12)
       .str_pad($pwd, 14)
       .$status."\n";

    ($httpCode == 200) ? $api_ok++ : $api_fail++;
}

echo "\nC# API OK: $api_ok | Fallos: $api_fail\n";
