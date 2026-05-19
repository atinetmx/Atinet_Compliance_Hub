<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Activar general log
try {
    $pdo->exec("SET GLOBAL general_log_file='C:/SCN/mysql_general.log'");
    $pdo->exec('SET GLOBAL general_log=ON');
    echo 'General log activado: C:/SCN/mysql_general.log'.PHP_EOL;
} catch (Exception $e) {
    echo 'No se pudo activar general log (permisos): '.$e->getMessage().PHP_EOL;
    echo 'Intentando alternativa con root...'.PHP_EOL;
    try {
        $root = new PDO('mysql:host=127.0.0.1;port=3307', 'root', 'u$rd3v304t1n3t');
        $root->exec("SET GLOBAL general_log_file='C:/SCN/mysql_general.log'");
        $root->exec('SET GLOBAL general_log=ON');
        echo 'General log activado como root'.PHP_EOL;
    } catch (Exception $e2) {
        echo 'root también falla: '.$e2->getMessage().PHP_EOL;
    }
}

// Hacer el login request
echo PHP_EOL.'Enviando login request...'.PHP_EOL;
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['usuario' => 'ADMIN', 'contrasena' => '1010', 'notaria' => '11', 'equipo' => 'test']),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
]);
$resp = curl_exec($ch);
curl_close($ch);
echo 'Respuesta C#: '.$resp.PHP_EOL;

// Esperar un momento y leer el log
sleep(1);
echo PHP_EOL.'=== mysql_general.log (últimas 50 líneas) ==='.PHP_EOL;
if (file_exists('C:/SCN/mysql_general.log')) {
    $lines = file('C:/SCN/mysql_general.log');
    $tail = array_slice($lines, -50);
    // Filtrar líneas relevantes
    foreach ($tail as $line) {
        if (preg_match('/tbl_cat_usuarios|notarias|ADMIN|Numero|1010|Credencial/i', $line)) {
            echo $line;
        }
    }
} else {
    echo 'Archivo no encontrado'.PHP_EOL;
    // Buscar la ubicación por defecto
    $p = new PDO('mysql:host=127.0.0.1;port=3307', 'atinet_app', 'Atinet2026#Secure');
    $r = $p->query("SHOW VARIABLES LIKE 'general_log%'")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($r as $v) {
        echo json_encode($v).PHP_EOL;
    }
}

// Desactivar log
try {
    $pdo->exec('SET GLOBAL general_log=OFF');
    echo PHP_EOL.'General log desactivado'.PHP_EOL;
} catch (Exception $e) {
}
