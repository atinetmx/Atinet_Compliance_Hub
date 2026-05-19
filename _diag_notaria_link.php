<?php

/**
 * Diagnóstico completo: ¿Qué valor usa C# para filtrar Numero_Notaria?
 * Compara notarias.id vs notarias.numero_notaria vs tbl_cat_usuarios.Numero_Notaria
 */
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo '=== notarias: id vs numero_notaria vs tenant_db_name ==='.PHP_EOL;
$notarias = $pdo->query('SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($notarias as $n) {
    echo '  '.json_encode($n).PHP_EOL;
}

echo PHP_EOL.'=== Por cada tenant, Numero_Notaria en tbl_cat_usuarios ==='.PHP_EOL;
foreach ($notarias as $n) {
    $db = $n['tenant_db_name'];
    try {
        $t = new PDO("mysql:host=127.0.0.1;port=3307;dbname=$db", 'atinet_app', 'Atinet2026#Secure');
        $distinct = $t->query('SELECT DISTINCT Numero_Notaria FROM tbl_cat_usuarios')->fetchAll(PDO::FETCH_COLUMN);
        echo "  notaria.id={$n['id']} | notaria.numero={$n['numero_notaria']} | DB=$db | tbl_cat Numero_Notaria=".implode(',', $distinct).PHP_EOL;
    } catch (Exception $e) {
        echo "  DB=$db ERROR: ".$e->getMessage().PHP_EOL;
    }
}

echo PHP_EOL.'=== C# recibe notaria=ID, busca en notarias WHERE Id=? ==='.PHP_EOL;
echo '  El campo que pasa C# a WHERE Numero_Notaria=? es probablemente notarias.numero_notaria'.PHP_EOL;
echo '  (no el id). Verificamos si hay coincidencia:'.PHP_EOL;
foreach ($notarias as $n) {
    $db = $n['tenant_db_name'];
    try {
        $t = new PDO("mysql:host=127.0.0.1;port=3307;dbname=$db", 'atinet_app', 'Atinet2026#Secure');
        // Buscar por numero_notaria (lo que Alex dice que usa)
        $byNumero = $t->query("SELECT COUNT(*) FROM tbl_cat_usuarios WHERE Numero_Notaria='{$n['numero_notaria']}'")->fetchColumn();
        // Buscar por id
        $byId = $t->query("SELECT COUNT(*) FROM tbl_cat_usuarios WHERE Numero_Notaria='{$n['id']}'")->fetchColumn();
        echo "  notaria.id={$n['id']} numero={$n['numero_notaria']} | match_by_numero=$byNumero | match_by_id=$byId".PHP_EOL;
    } catch (Exception $e) {
        echo "  DB=$db ERROR".PHP_EOL;
    }
}

echo PHP_EOL.'=== users super_admin: notaria_id actual ==='.PHP_EOL;
$users = $pdo->query("SELECT id, email, tipo_cuenta, notaria_id, cn_usuario_id FROM users WHERE tipo_cuenta='super_admin' ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo '  '.json_encode($u).PHP_EOL;
}

echo PHP_EOL.'=== cn_password descifrado para super_admins ==='.PHP_EOL;
// Verificar que cn_password corresponde a la contraseña del cn_usuario_id
foreach ($users as $u) {
    if (! $u['cn_usuario_id']) {
        continue;
    }
    $cnUser = $pdo->query("SELECT Id, Usuario, LEFT(Contrasena,7) as prefix FROM tbl_cat_usuarios WHERE Id={$u['cn_usuario_id']}")->fetch(PDO::FETCH_ASSOC);
    echo "  users.id={$u['id']} email={$u['email']} cn_id={$u['cn_usuario_id']} cn_user=".($cnUser['Usuario'] ?? 'NOT FOUND').PHP_EOL;
}
