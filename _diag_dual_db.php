<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TABLAS tbl_* EN MYSQL (atinet_compliance_hub) ===\n";
$tablas = DB::select("SHOW TABLES LIKE 'tbl_%'");
foreach ($tablas as $t) {
    $nombre = array_values((array)$t)[0];
    $count = DB::table($nombre)->count();
    echo "  {$nombre}: {$count} registros\n";
}

echo "\n=== COMPARATIVA: tbl_cat_usuarios MYSQL vs JWT payload ===\n";
$usuarios = DB::table('tbl_cat_usuarios')
    ->select('Id', 'Usuario', 'Sesion_Iniciada', 'Activo')
    ->get();
foreach ($usuarios as $u) {
    $laravelUser = DB::table('users')->where('cn_usuario_id', $u->Id)->first();
    $email = $laravelUser ? $laravelUser->email : '(sin usuario Laravel)';
    echo "  CN Id={$u->Id} Usuario={$u->Usuario} SI={$u->Sesion_Iniciada} Activo={$u->Activo} → Laravel: {$email}\n";
}

echo "\n=== tbl_log_sesiones_activas EN MYSQL ===\n";
$sesiones = DB::table('tbl_log_sesiones_activas')->get();
echo "  Total registros: " . count($sesiones) . "\n";
foreach ($sesiones as $s) {
    echo "  => " . json_encode((array)$s, JSON_UNESCAPED_UNICODE) . "\n";
}

// Intentar conectar a SQL Server
echo "\n=== INTENTANDO CONECTAR A SQL SERVER ===\n";
try {
    $pdo = new PDO(
        "sqlsrv:Server=SRVATINET\\ATINETSQL;Database=atinet_compliance_hub;TrustServerCertificate=1",
        'sa',
        'u$r$4_471n37',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "Conexion OK a SQL Server\n";
    
    $stmt = $pdo->query("SELECT Id, Usuario, Sesion_Iniciada, Activo FROM tbl_cat_usuarios ORDER BY Id");
    echo "tbl_cat_usuarios en SQL Server:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  Id={$row['Id']} Usuario={$row['Usuario']} SI={$row['Sesion_Iniciada']} Activo={$row['Activo']}\n";
    }
    
    $stmt2 = $pdo->query("SELECT COUNT(*) as total FROM tbl_log_sesiones_activas");
    $r = $stmt2->fetch(PDO::FETCH_ASSOC);
    echo "tbl_log_sesiones_activas en SQL Server: {$r['total']} registros\n";
    
} catch (Exception $e) {
    echo "Error SQL Server: " . $e->getMessage() . "\n";
    echo "(Si PDO sqlsrv no está instalado, instalar php_sqlsrv o usar ODBC)\n";
}
