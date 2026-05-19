<?php

/**
 * Diagnóstico: BD separada bd_SistemaControlNotarial_Principal
 * La mySqlConnectionDebug de C# usa root:u$rd3v304t1n3t
 * Puede ser la BD que Alex usa cuando accede a las "vistas de C#"
 */
echo '=== Intentando conectar a bd_SistemaControlNotarial_Principal ==='.PHP_EOL;

$configs = [
    ['root', 'u$rd3v304t1n3t', 3307],
    ['root', 'u$rd3v304t1n3t', 3306],
    ['root', '',               3307],
    ['atinet_app', 'Atinet2026#Secure', 3307],
];

$connected = null;
foreach ($configs as [$u, $p, $port]) {
    try {
        $cn = new PDO("mysql:host=127.0.0.1;port=$port;dbname=bd_SistemaControlNotarial_Principal", $u, $p,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        echo "OK: $u / port=$port".PHP_EOL;
        $connected = $cn;
        break;
    } catch (Exception $e) {
        echo "FAIL $u/port=$port: ".$e->getMessage().PHP_EOL;
    }
}

if ($connected) {
    echo PHP_EOL.'=== Tablas ==='.PHP_EOL;
    $tables = $connected->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $t) {
        echo "  $t".PHP_EOL;
    }

    if (in_array('tbl_cat_usuarios', $tables)) {
        echo PHP_EOL.'=== Usuarios en tbl_cat_usuarios ==='.PHP_EOL;
        $rows = $connected->query('SELECT Id, Usuario, Numero_Notaria, Activo, LEFT(Contrasena,7) as prefix FROM tbl_cat_usuarios ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            echo '  '.json_encode($r).PHP_EOL;
        }
    }
} else {
    echo PHP_EOL.'No se pudo conectar a bd_SistemaControlNotarial_Principal con ninguna credencial.'.PHP_EOL;
    // Listar todas las bases de datos disponibles con root
    try {
        $root = new PDO('mysql:host=127.0.0.1;port=3307', 'root', 'u$rd3v304t1n3t', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $dbs = $root->query('SHOW DATABASES')->fetchAll(PDO::FETCH_COLUMN);
        echo 'Bases de datos disponibles como root: '.PHP_EOL;
        foreach ($dbs as $db) {
            echo "  $db".PHP_EOL;
        }
    } catch (Exception $e2) {
        echo 'root también falla: '.$e2->getMessage().PHP_EOL;
    }
}

echo PHP_EOL.'=== ¿Qué DB usa el C# en PRODUCCIÓN? ==='.PHP_EOL;
echo 'MasterConnection está configurado en appsettings.json:'.PHP_EOL;
$settings = json_decode(file_get_contents('C:\\SCN\\appsettings.json'), true);
foreach ($settings['ConnectionStrings'] ?? [] as $k => $v) {
    echo "  $k: $v".PHP_EOL;
}

// Buscar en el DLL si usa MasterConnection o mySqlConnectionRelease
echo PHP_EOL.'=== Strings de conexión en el DLL ==='.PHP_EOL;
$bytes = file_get_contents('C:\\SCN\\ATINET.SistemaControlNotarial.Api.dll');
$utf16 = mb_convert_encoding($bytes, 'UTF-8', 'UTF-16LE');
foreach (['MasterConnection', 'mySqlConnection', 'TenantBase', 'Debug', 'Release'] as $key) {
    if (strpos($utf16, $key) !== false) {
        echo "  FOUND: $key".PHP_EOL;
    }
}
