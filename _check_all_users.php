<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo "=== notarias (todas) ===\n";
$rows = $pdo->query('SELECT id, nombre, numero_notaria, tenant_db_name, activa FROM notarias ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "  id={$r['id']} | numero_notaria={$r['numero_notaria']} | tenant_db={$r['tenant_db_name']} | activa={$r['activa']} | {$r['nombre']}\n";
}

echo "\n=== tbl_cat_usuarios (todos) ===\n";
$rows = $pdo->query('SELECT Id, Usuario, Correo, Numero_Notaria, Rol_Id, Tipo, Activo, Sesion_Iniciada, LEFT(Contrasena,7) as Hash_Prefix FROM tbl_cat_usuarios ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "  Id={$r['Id']} | Usuario={$r['Usuario']} | Notaria={$r['Numero_Notaria']} | Rol={$r['Rol_Id']} | Tipo={$r['Tipo']} | Activo={$r['Activo']} | Sesion={$r['Sesion_Iniciada']} | Hash={$r['Hash_Prefix']}\n";
}

echo "\n=== users Laravel (todos) ===\n";
$rows = $pdo->query('SELECT id, name, email, notaria_id, tipo_cuenta, cn_usuario_id FROM users ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "  id={$r['id']} | {$r['email']} | notaria_id={$r['notaria_id']} | tipo={$r['tipo_cuenta']} | cn_usuario_id={$r['cn_usuario_id']}\n";
}

echo "\n=== tbl_log_sesiones_activas activas ===\n";
$rows = $pdo->query('SELECT Id, Usuario_Id, Es_Activa, Fecha_Expiracion FROM tbl_log_sesiones_activas WHERE Es_Activa=1')->fetchAll(PDO::FETCH_ASSOC);
if ($rows) {
    foreach ($rows as $r) {
        print_r($r);
    }
} else {
    echo "  Ninguna sesión activa\n";
}
