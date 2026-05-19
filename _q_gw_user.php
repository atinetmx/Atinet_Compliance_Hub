<?php

// Check all tenant DBs for LARAVEL_GW user and their passwords + Numero_Notaria
$tenants = [
    ['db' => 'atinet_edomex_notaria_11', 'notaria_id' => 1, 'numero' => '11'],
    ['db' => 'atinet_edomex_notaria_10', 'notaria_id' => 2, 'numero' => '10'],
    ['db' => 'atinet_mor_notaria_10', 'notaria_id' => 3, 'numero' => '10'],
    ['db' => 'atinet_oax_notaria_113', 'notaria_id' => 4, 'numero' => '113'],
    ['db' => 'atinet_edomex_notaria_60', 'notaria_id' => 6, 'numero' => '60'],
    ['db' => 'atinet_edomex_notaria_100', 'notaria_id' => 9, 'numero' => '100'],
    ['db' => 'atinet_edomex_notaria_101', 'notaria_id' => 10, 'numero' => '101'],
];

echo "=== LARAVEL_GW user in all tenant DBs ===\n";
foreach ($tenants as $t) {
    try {
        $pdo = new PDO("mysql:host=localhost;port=3307;dbname={$t['db']}", 'atinet_app', 'Atinet2026#Secure');
        $stmt = $pdo->prepare("SELECT Id, Usuario, Contrasena, Numero_Notaria, Activo, Rol_Id FROM tbl_cat_usuarios WHERE Usuario = 'LARAVEL_GW' LIMIT 1");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            echo "DB={$t['db']} (notarias.id={$t['notaria_id']}, numero_notaria={$t['numero']})\n";
            echo "  Usuario: {$user['Usuario']} | Numero_Notaria: {$user['Numero_Notaria']} | Activo: {$user['Activo']} | Rol: {$user['Rol_Id']}\n";
            echo '  Contrasena hash: '.substr($user['Contrasena'], 0, 60)."...\n";
        } else {
            echo "DB={$t['db']}: NO LARAVEL_GW user\n";
        }
    } catch (Exception $e) {
        echo "DB={$t['db']}: ERROR: ".$e->getMessage()."\n";
    }
}

// Also check what password Laravel sends
echo "\n=== ControlNotarialApiService credentials ===\n";
$configFile = file_get_contents(__DIR__.'/app/Services/ControlNotarialApiService.php');
preg_match_all('/(usuario|contrasena|password|LARAVEL|gateway).{0,100}/i', $configFile, $matches);
foreach ($matches[0] as $m) {
    echo trim($m)."\n";
}
