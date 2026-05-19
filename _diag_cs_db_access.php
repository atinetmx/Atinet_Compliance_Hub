<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== 1. Estado completo de SUPERUSUARIO en master DB ===\n";
$u = DB::table('tbl_cat_usuarios')->where('Id', 9)->first();
foreach ((array) $u as $k => $v) {
    echo "  {$k}: ".var_export($v, true)."\n";
}

echo "\n=== 2. Verificar conexión con credenciales de C# (atinet_app) ===\n";
try {
    $pdo = new PDO(
        'mysql:host=localhost;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
        'atinet_app',
        'Atinet2026#Secure',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
    );
    echo "✅ atinet_app puede conectarse a atinet_compliance_hub\n";
    $row = $pdo->query('SELECT Id, Usuario, Numero_Notaria, Contrasena, Activo FROM tbl_cat_usuarios WHERE Id=9')->fetch(PDO::FETCH_ASSOC);
    echo '  SUPERUSUARIO: '.json_encode($row)."\n";

    // Simular la query exacta que haría C#: Numero_Notaria = '11'
    $stmt = $pdo->prepare('SELECT * FROM tbl_cat_usuarios WHERE Usuario = ? AND Numero_Notaria = ?');
    $stmt->execute(['SUPERUSUARIO', '11']);
    $found = $stmt->fetch(PDO::FETCH_ASSOC);
    echo $found ? "✅ Query C# encuentra SUPERUSUARIO con Numero_Notaria='11'\n" : "❌ Query C# NO encuentra SUPERUSUARIO\n";
    if ($found) {
        $hash = $found['Contrasena'];
        echo "  Hash en BD: {$hash}\n";
        echo "  PHP verify('1010'): ".(password_verify('1010', $hash) ? 'MATCH ✅' : 'NO MATCH ❌')."\n";
    }
} catch (\PDOException $e) {
    echo '❌ Error conexión atinet_app: '.$e->getMessage()."\n";
}

echo "\n=== 3. Probar privilegios de atinet_app (SHOW GRANTS) ===\n";
try {
    $grants = DB::select("SHOW GRANTS FOR 'atinet_app'@'localhost'");
    foreach ($grants as $g) {
        echo '  '.current((array) $g)."\n";
    }
} catch (\Throwable $e) {
    echo '  Error: '.$e->getMessage()."\n";
}
