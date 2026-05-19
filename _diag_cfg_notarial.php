<?php

$pass = 'Atinet2026#Secure';
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', $pass);

// Ver todas las tablas en master DB
echo "=== TABLES in atinet_compliance_hub ===\n";
$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo implode(', ', $tables)."\n\n";

// Verificar configuracion_notarial
if (in_array('configuracion_notarial', $tables)) {
    echo "=== configuracion_notarial ===\n";
    $rows = $pdo->query('SELECT * FROM configuracion_notarial')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
    }
} else {
    echo "TABLE configuracion_notarial NOT FOUND in master\n";
}

// Ver tablas en tenant atinet_edomex_notaria_11
$pdo2 = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', $pass);
echo "\n=== TABLES in atinet_edomex_notaria_11 ===\n";
$tables2 = $pdo2->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo implode(', ', $tables2)."\n\n";

if (in_array('configuracion_notarial', $tables2)) {
    echo "=== configuracion_notarial in tenant ===\n";
    $rows2 = $pdo2->query('SELECT * FROM configuracion_notarial')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows2 as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
    }
} else {
    echo "TABLE configuracion_notarial NOT FOUND in tenant11\n";
}

// Ver también cat_roles en caso de que el problema sea el Rol
echo "\n=== cat_roles en master ===\n";
if (in_array('tbl_cat_roles', $tables)) {
    $roles = $pdo->query('SELECT * FROM tbl_cat_roles')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($roles as $r) {
        echo json_encode($r)."\n";
    }
} else {
    echo "tbl_cat_roles NOT FOUND\n";
}

// Probar login directo con notaria=11 desde PHP simulando lo que C# hace
echo "\n=== Simulating C# login for SUPERUSUARIO (notariaId=11) ===\n";
$notariaId = 11;
// Step 1: Find tenant_db_name
$tenant = $pdo->query("SELECT tenant_db_name FROM notarias WHERE Id = $notariaId LIMIT 1")->fetch(PDO::FETCH_COLUMN);
echo "Step1 tenant_db_name: $tenant\n";

// Step 2: Query tbl_cat_usuarios in that tenant DB
$pdoTenant = new PDO("mysql:host=127.0.0.1;port=3307;dbname=$tenant", 'atinet_app', $pass);
$user = $pdoTenant->prepare('SELECT * FROM tbl_cat_usuarios WHERE Usuario = ? AND Numero_Notaria = ? LIMIT 1');
$user->execute(['SUPERUSUARIO', (string) $notariaId]);
$userRow = $user->fetch(PDO::FETCH_ASSOC);
echo 'Step2 user found: '.($userRow ? 'YES' : 'NO')."\n";
if ($userRow) {
    echo '  Activo: '.$userRow['Activo']."\n";
    echo '  Sesion_Iniciada: '.$userRow['Sesion_Iniciada']."\n";
    echo '  Contrasena prefix: '.substr($userRow['Contrasena'], 0, 10)."\n";
    echo "  PHP verify 'pasword123': ".(password_verify('pasword123', $userRow['Contrasena']) ? 'YES' : 'NO')."\n";
}
