<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Limpiar sesiones obsoletas
$del = $pdo->exec('DELETE FROM tbl_log_sesiones_activas WHERE Usuario_Id = 1');
echo "Sesiones eliminadas: $del\n";

// 2. Reset Sesion_Iniciada
$upd = $pdo->exec('UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0 WHERE Sesion_Iniciada = 1');
echo "Usuarios con sesion reseteada: $upd\n";

// 3. Fix hash prefix $2b$ -> $2a$
$fix = $pdo->exec("UPDATE tbl_cat_usuarios SET Contrasena = CONCAT('\$2a\$', SUBSTRING(Contrasena, 5)) WHERE Contrasena LIKE '\$2b\$%'");
echo "Hashes corregidos (\$2b\$->\$2a\$): $fix\n";

// 4. Verificar resultado
echo "\n--- Prefijos actuales en tbl_cat_usuarios ---\n";
$rows = $pdo->query('SELECT Id, Usuario, SUBSTRING(Contrasena,1,7) as prefix FROM tbl_cat_usuarios ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo $r['Id'].' | '.str_pad($r['Usuario'], 20).' | '.$r['prefix']."\n";
}

// 5. Verificar sesiones limpias
$sesiones = $pdo->query('SELECT COUNT(*) as total FROM tbl_log_sesiones_activas')->fetchColumn();
echo "\nSesiones activas restantes: $sesiones\n";
