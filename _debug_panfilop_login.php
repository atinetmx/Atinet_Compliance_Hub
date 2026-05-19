<?php

/**
 * Debug: Check tenant users table and see what Id C# actually reads for PANFILOP.
 * Also test with a live C# login and compare log entries before/after.
 */
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$tenantPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "=== Tenant atinet_edomex_notaria_11 users table ===\n";
foreach ($tenantPdo->query('SELECT id, name, email, cn_usuario_id FROM users ORDER BY id') as $r) {
    echo "  users.id={$r['id']} {$r['name']} cn_usuario_id={$r['cn_usuario_id']}\n";
}

echo "\n=== tbl_cat_usuarios in tenant ===\n";
foreach ($tenantPdo->query('SELECT Id, Usuario FROM tbl_cat_usuarios ORDER BY Id') as $r) {
    echo "  tbl_cat_usuarios.Id={$r['Id']} {$r['Usuario']}\n";
}

// Test all IDs in the tenant for tbl_log_bitacora
echo "\n=== INSERT test for IDs 1..25 ===\n";
for ($id = 1; $id <= 25; $id++) {
    $tenantPdo->beginTransaction();
    try {
        $tenantPdo->prepare("INSERT INTO tbl_log_bitacora (Usuario_Id, Operacion, Tabla, Equipo) VALUES (?, 'TEST', 'TEST', 'diag')")->execute([$id]);
        $tenantPdo->rollBack();
        echo "  Id=$id → ✓ OK\n";
    } catch (PDOException $e) {
        $tenantPdo->rollBack();
        echo "  Id=$id → ✗ FAIL\n";
    }
}

// Clean and run C# login test, then immediately check
echo "\n=== C# Login test for PANFILOP ===\n";
$tenantPdo->exec('UPDATE tbl_cat_usuarios SET Sesion_Iniciada=0');
$tenantPdo->exec('DELETE FROM tbl_log_sesiones_activas');

$beforeBitacora = (int) $tenantPdo->query('SELECT COALESCE(MAX(Id),0) FROM tbl_log_bitacora')->fetchColumn();
$beforeGeneral = (int) $tenantPdo->query('SELECT COALESCE(MAX(Id),0) FROM tbl_log_general')->fetchColumn();
$beforeSession = (int) $tenantPdo->query('SELECT COALESCE(MAX(Id),0) FROM tbl_log_sesiones_activas')->fetchColumn();
echo "Before - bitacora MAX=$beforeBitacora, general MAX=$beforeGeneral, session MAX=$beforeSession\n";

$user = DB::table('users')->where('cn_usuario_id', 10)->first();
$cnRow = DB::table('tbl_cat_usuarios')->where('Id', 10)->first();
$plainPwd = decrypt($user->cn_password);
$url = rtrim(config('services.control_notarial.internal_url'), '/').'/Login/Authentication';
$resp = Http::withoutVerifying()->timeout(15)->post($url, [
    'usuario' => $cnRow->Usuario,
    'contrasena' => $plainPwd,
    'notaria' => (string) $user->notaria_id,
    'equipo' => 'Diag-Test',
]);
echo "HTTP {$resp->status()}: ".$resp->body()."\n\n";

// Check what was inserted BEFORE the error
echo "After session rows:\n";
foreach ($tenantPdo->query('SELECT * FROM tbl_log_sesiones_activas') as $r) {
    echo "  Usuario_Id={$r['Usuario_Id']}\n";
}

// Try to read from the InnoDB error log or check MySQL variables for hints
echo "\nSesion_Iniciada state:\n";
foreach ($tenantPdo->query('SELECT Id, Usuario, Sesion_Iniciada FROM tbl_cat_usuarios') as $r) {
    echo "  Id={$r['Id']} {$r['Usuario']} Sesion={$r['Sesion_Iniciada']}\n";
}
