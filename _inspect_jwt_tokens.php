<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Buscar cualquier JWT almacenado en caché
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo '=== JWTs en cache laravel (cache table) ==='.PHP_EOL;
try {
    $rows = $pdo->query("SELECT `key`, `value`, expiration FROM cache WHERE `key` LIKE '%cn_%' OR `key` LIKE '%jwt%' OR `key` LIKE '%token%' ORDER BY expiration DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        // Deserializar el valor (Laravel lo almacena serializado)
        $val = unserialize($r['value']);
        echo "key={$r['key']} exp={$r['expiration']}".PHP_EOL;
        if (is_string($val) && strlen($val) > 20) {
            // Intentar decodificar como JWT (base64)
            $parts = explode('.', $val);
            if (count($parts) === 3) {
                $header = json_decode(base64_decode(str_pad(strtr($parts[0], '-_', '+/'), strlen($parts[0]) % 4 == 0 ? strlen($parts[0]) : strlen($parts[0]) + 4 - strlen($parts[0]) % 4, '=', STR_PAD_RIGHT)), true);
                $payload = json_decode(base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4 == 0 ? strlen($parts[1]) : strlen($parts[1]) + 4 - strlen($parts[1]) % 4, '=', STR_PAD_RIGHT)), true);
                echo '  JWT header:  '.json_encode($header).PHP_EOL;
                echo '  JWT payload: '.json_encode($payload, JSON_UNESCAPED_UNICODE).PHP_EOL;
            } else {
                echo '  value: '.substr($val, 0, 100).PHP_EOL;
            }
        }
    }
    if (empty($rows)) {
        echo '(ninguno en tabla cache)'.PHP_EOL;
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage().PHP_EOL;
}

// Buscar en tbl_log_sesiones_activas
echo PHP_EOL.'=== tbl_log_sesiones_activas ==='.PHP_EOL;
try {
    $rows = $pdo->query('SELECT * FROM tbl_log_sesiones_activas ORDER BY Id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        $token = $r['Token'] ?? $r['token'] ?? null;
        if ($token) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4 == 0 ? strlen($parts[1]) : strlen($parts[1]) + 4 - strlen($parts[1]) % 4, '=', STR_PAD_RIGHT)), true);
                $r['token_payload'] = $payload;
            }
        }
        unset($r['Token']);
        unset($r['token']);
        echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
    }
    if (empty($rows)) {
        echo '(vacío)'.PHP_EOL;
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage().PHP_EOL;
}

// Revisar columnas de tbl_log_sesiones_activas
echo PHP_EOL.'=== Columnas tbl_log_sesiones_activas ==='.PHP_EOL;
$cols = $pdo->query('SHOW COLUMNS FROM tbl_log_sesiones_activas')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']} {$c['Type']}".PHP_EOL;
}
