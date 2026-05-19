<?php

// Probar conexión a port 3306 con diferentes usuarios
$users = [
    ['root', ''],
    ['root', 'root'],
    ['root', 'u$rd3v304t1n3t'],  // password de mySqlConnectionDebug
    ['atinet_app', 'Atinet2026#Secure'],
];

foreach ($users as [$u, $p]) {
    try {
        $pdo = new PDO('mysql:host=localhost;port=3306;charset=utf8mb4', $u, $p,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3]);
        $dbs = $pdo->query('SHOW DATABASES')->fetchAll(PDO::FETCH_COLUMN);
        echo "✅ port 3306 user='{$u}' → DBs: ".implode(', ', $dbs)."\n";

        if (in_array('atinet_compliance_hub', $dbs)) {
            $pdo->exec('USE atinet_compliance_hub');
            $row = $pdo->query('SELECT Id, Usuario, Numero_Notaria, LEFT(Contrasena,20) as Hash FROM tbl_cat_usuarios WHERE Id=9')->fetch(PDO::FETCH_ASSOC);
            echo '  SUPERUSUARIO en 3306: '.json_encode($row)."\n";
            $n = $pdo->query('SELECT id, tenant_db_name FROM notarias ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
            foreach ($n as $r) {
                echo "  notaria id={$r['id']} → {$r['tenant_db_name']}\n";
            }
        }
        break;
    } catch (PDOException $e) {
        echo "❌ port 3306 user='{$u}': ".$e->getMessage()."\n";
    }
}
