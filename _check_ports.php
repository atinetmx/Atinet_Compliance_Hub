<?php

foreach ([3306, 3307] as $port) {
    echo "\n=== MySQL port {$port} ===\n";
    try {
        $pdo = new PDO(
            "mysql:host=localhost;port={$port};dbname=atinet_compliance_hub;charset=utf8mb4",
            'atinet_app', 'Atinet2026#Secure',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
        );
        echo "CONECTADO\n";
        $u = $pdo->query('SELECT Id, Usuario, Numero_Notaria, LEFT(Contrasena,20) as Hash FROM tbl_cat_usuarios WHERE Id=9')->fetch(PDO::FETCH_ASSOC);
        echo 'SUPERUSUARIO: '.json_encode($u)."\n";
        $n = $pdo->query('SELECT id, tenant_db_name FROM notarias ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($n as $r) {
            echo "  notaria id={$r['id']} → {$r['tenant_db_name']}\n";
        }
    } catch (Exception $e) {
        echo 'ERROR: '.$e->getMessage()."\n";
    }
}
