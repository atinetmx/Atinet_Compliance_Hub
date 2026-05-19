<?php

$pass = 'Atinet2026#Secure';
$pdo = new PDO('mysql:host=127.0.0.1;port=3307', 'atinet_app', $pass);

// Listar DBs
$dbs = $pdo->query('SHOW DATABASES')->fetchAll(PDO::FETCH_COLUMN);
echo "=== DATABASES ===\n";
echo implode("\n", $dbs)."\n\n";

// Comprobar si bd_sistemacontrolnotarial_principal existe
$cn_db = 'bd_sistemacontrolnotarial_principal';
$exists = in_array(strtolower($cn_db), array_map('strtolower', $dbs));
echo 'bd_sistemacontrolnotarial_principal exists: '.($exists ? 'YES' : 'NO')."\n\n";

// Ver hash en atinet_compliance_hub.tbl_cat_usuarios para SUPERUSUARIO
$pdo2 = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', $pass);

// tbl_log_general recientes
$rows = $pdo2->query('SELECT Id, Estatus, Operacion, Descripcion, Datos, Fecha_Creacion FROM tbl_log_general ORDER BY Id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
echo "=== tbl_log_general (últimos 5) ===\n";
foreach ($rows as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
}

// Hash actual de SUPERUSUARIO
echo "\n=== SUPERUSUARIO hash ===\n";
$row = $pdo2->query('SELECT Id, Usuario, Numero_Notaria, Contrasena, CHAR_LENGTH(Contrasena) as clen, LENGTH(Contrasena) as blen FROM tbl_cat_usuarios WHERE Id = 9')->fetch(PDO::FETCH_ASSOC);
echo 'Contrasena: '.$row['Contrasena']."\n";
echo "Chars: {$row['clen']}, Bytes: {$row['blen']}\n";
echo "PHP verify 'pasword123': ".(password_verify('pasword123', $row['Contrasena']) ? 'YES' : 'NO')."\n";
$info = password_get_info($row['Contrasena']);
echo 'Hash algo: '.$info['algoName'].' options: '.json_encode($info['options'])."\n";

// Ver un tenant user para comparar
echo "\n=== Sample tenant user (atinet_edomex_notaria_11) ===\n";
try {
    $pdo3 = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', $pass);
    $r3 = $pdo3->query('SELECT Id, Usuario, Numero_Notaria, CHAR_LENGTH(Contrasena) as clen, LEFT(Contrasena,10) as prefix FROM tbl_cat_usuarios LIMIT 3')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($r3 as $r) {
        echo "Id={$r['Id']} Usuario={$r['Usuario']} NN={$r['Numero_Notaria']} len={$r['clen']} prefix={$r['prefix']}\n";
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

// Check appsettings.json de C#
echo "\n=== C# appsettings.json ===\n";
$cfg = file_get_contents('C:\\SCN\\appsettings.json');
echo $cfg."\n";
