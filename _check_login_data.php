<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo "=== users (notaria_id=11) ===\n";
$stmt = $pdo->query('SELECT id, name, email, notaria_id FROM users WHERE notaria_id = 11 LIMIT 10');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
if ($rows) {
    foreach ($rows as $r) {
        print_r($r);
    }
} else {
    echo "NINGUNO\n";
}

echo "\n=== COLUMNAS tbl_log_sesiones_activas ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM tbl_log_sesiones_activas')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo $c['Field'].' '.$c['Type'].' '.$c['Null'].PHP_EOL;
}

echo "\n=== Usuario ADMIN en users (por email) ===\n";
$stmt = $pdo->query("SELECT id, name, email, notaria_id FROM users WHERE email = 'admin@atinet.com.mx' LIMIT 3");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
if ($rows) {
    foreach ($rows as $r) {
        print_r($r);
    }
} else {
    echo "NO HAY usuario en users con ese correo\n";
}

// Verificar notaria 11 - IGNORAR ESTO
echo "\n=== NOTARIA 11 - IGNORAR ===\n";
$stmt = $pdo->query('SELECT * FROM notarias WHERE id = 11 OR Numero_Notaria = 11 LIMIT 3');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
if ($rows) {
    foreach ($rows as $r) {
        print_r($r);
    }
} else {
    echo "NO ENCONTRADA\n";
}

// Ver estructura de tbl_cat_usuarios
echo "\n=== COLUMNAS tbl_cat_usuarios ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM tbl_cat_usuarios')->fetchAll(PDO::FETCH_COLUMN);
foreach ($cols as $c) {
    echo $c.PHP_EOL;
}

// Buscar usuario ADMIN
echo "\n=== USUARIO ADMIN ===\n";
$stmt = $pdo->query("SELECT * FROM tbl_cat_usuarios WHERE Usuario LIKE 'ADMIN' OR Nombre LIKE 'ADMIN' LIMIT 5");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
if ($rows) {
    foreach ($rows as $r) {
        print_r($r);
    }
} else {
    echo "NO ENCONTRADO\n";
}
