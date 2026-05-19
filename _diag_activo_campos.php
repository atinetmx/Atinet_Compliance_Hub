<?php

$pass = 'Atinet2026#Secure';

// Master DB
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', $pass);

echo "=== tbl_cat_usuarios MASTER (todos los campos relevantes) ===\n";
$rows = $pdo->query('SELECT Id, Usuario, Numero_Notaria, Activo, Sesion_Iniciada, Tipo, Rol_Id, LEFT(Contrasena,10) as hash_prefix FROM tbl_cat_usuarios')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r)."\n";
}

// Test with ELIZABETH.ORTEGA credentials from tenant DB (notaria=1 -> atinet_edomex_notaria_11)
echo "\n=== tbl_cat_usuarios atinet_edomex_notaria_11 ===\n";
$pdo2 = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', $pass);
$rows2 = $pdo2->query('SELECT Id, Usuario, Numero_Notaria, Activo, Sesion_Iniciada, Tipo, Rol_Id, LEFT(Contrasena,10) as hash_prefix, CHAR_LENGTH(Contrasena) as hash_len FROM tbl_cat_usuarios LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows2 as $r) {
    echo json_encode($r)."\n";
}

// Verificar que ELIZABETH.ORTEGA existe en este tenant
echo "\n=== ELIZABETH.ORTEGA en tenant atinet_edomex_notaria_11 ===\n";
$liz = $pdo2->query("SELECT Id, Usuario, Numero_Notaria, Activo, Sesion_Iniciada, Contrasena FROM tbl_cat_usuarios WHERE Usuario = 'ELIZABETH.ORTEGA'")->fetch(PDO::FETCH_ASSOC);
if ($liz) {
    echo 'Found: '.json_encode($liz)."\n";
    echo 'Hash prefix: '.substr($liz['Contrasena'], 0, 10)."\n";
    echo "PHP verify 'pasword123': ".(password_verify('pasword123', $liz['Contrasena']) ? 'YES' : 'NO')."\n";
} else {
    echo "NOT FOUND\n";
    // Buscar en todos los tenants
    $dbs = $pdo->query('SHOW DATABASES')->fetchAll(PDO::FETCH_COLUMN);
    foreach ($dbs as $db) {
        if (strpos($db, 'atinet_') === 0 && $db !== 'atinet_compliance_hub') {
            try {
                $ptemp = new PDO("mysql:host=127.0.0.1;port=3307;dbname=$db", 'atinet_app', $pass);
                $u = $ptemp->query("SELECT Id, Usuario, Numero_Notaria, Activo FROM tbl_cat_usuarios WHERE Usuario = 'ELIZABETH.ORTEGA'")->fetch(PDO::FETCH_ASSOC);
                if ($u) {
                    echo "Found in $db: ".json_encode($u)."\n";
                }
            } catch (Exception $e) {
            }
        }
    }
}

// Ver el appsettings.json del C#
echo "\n=== C# appsettings Logging level ===\n";
$cfg = json_decode(file_get_contents('C:\\SCN\\appsettings.json'), true);
echo 'LogLevel Default: '.$cfg['Logging']['LogLevel']['Default']."\n";
echo 'LogLevel AspNetCore: '.$cfg['Logging']['LogLevel']['Microsoft.AspNetCore']."\n";
