<?php
/**
 * Verificar columnas reales de la tabla cat_cp en atinet65_catalogos
 */

// Leer credenciales del .env
$env = [];
foreach (file('.env') as $line) {
    $line = trim($line);
    if ($line && !str_starts_with($line, '#') && str_contains($line, '=')) {
        [$k, $v] = explode('=', $line, 2);
        $env[trim($k)] = trim($v, '"\'');
    }
}

$host = $env['DB_CATALOGOS_HOST']     ?? $env['DB_HOST']     ?? '127.0.0.1';
$port = $env['DB_CATALOGOS_PORT']     ?? $env['DB_PORT']     ?? '3307';
$db   = $env['DB_CATALOGOS_DATABASE'] ?? 'atinet65_catalogos';
$user = $env['DB_CATALOGOS_USERNAME'] ?? $env['DB_USERNAME'] ?? 'root';
$pass = $env['DB_CATALOGOS_PASSWORD'] ?? $env['DB_PASSWORD'] ?? '';

echo "Conectando a $host:$port / $db ...\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión OK\n\n";

    // Columnas de cat_cp
    echo "=== COLUMNAS DE cat_cp ===\n";
    $cols = $pdo->query("DESCRIBE cat_cp")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo "  {$c['Field']} | {$c['Type']} | Null:{$c['Null']} | Default:{$c['Default']}\n";
    }

    // Fila de ejemplo
    echo "\n=== EJEMPLO (CP 44100 - Guadalajara) ===\n";
    $rows = $pdo->query("SELECT * FROM cat_cp WHERE d_codigo = '44100' LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
    if ($rows) {
        foreach ($rows as $i => $row) {
            echo "Fila $i:\n";
            foreach ($row as $k => $v) echo "  $k: $v\n";
            echo "\n";
        }
    } else {
        echo "  (sin resultados para 44100, probando otro CP)\n";
        $rows = $pdo->query("SELECT * FROM cat_cp LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $i => $row) {
            echo "Fila $i:\n";
            foreach ($row as $k => $v) echo "  $k: $v\n";
            echo "\n";
        }
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
