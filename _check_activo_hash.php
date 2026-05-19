<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo '=== TODOS los campos de ADMIN y SUPERUSUARIO ==='.PHP_EOL;
$rows = $pdo->query('SELECT * FROM tbl_cat_usuarios WHERE Id IN (1,9,18)')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    $hash = $r['Contrasena'];
    $r['Contrasena'] = substr($hash, 0, 7).'...';
    echo json_encode($r).PHP_EOL;

    // Verificar contraseñas posibles
    $plain_candidates = ['1010', 'pasword123', 'password123', 'ADMIN', 'admin', 'Atinet2024!', 'Atinet2026#Secure'];
    foreach ($plain_candidates as $plain) {
        $hash_php = str_replace('$2b$', '$2y$', $hash);
        if (password_verify($plain, $hash_php)) {
            echo "  ✓ password_verify('{$plain}') = OK".PHP_EOL;
        }
    }
}

echo PHP_EOL.'=== Log C# mas reciente ==='.PHP_EOL;
$logDir = 'C:\\SCN\\logs\\';
$logs = glob($logDir.'stdout_*.log');
usort($logs, fn ($a, $b) => filemtime($b) - filemtime($a));
$latest = array_slice($logs, 0, 2);
foreach ($latest as $logFile) {
    echo basename($logFile).':'.PHP_EOL;
    $lines = file($logFile);
    // Mostrar últimas 30 líneas
    $tail = array_slice($lines, -30);
    echo implode('', $tail).PHP_EOL;
}
