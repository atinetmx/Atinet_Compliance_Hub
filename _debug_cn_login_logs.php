<?php

/**
 * Check master log tables after successful C# login to see what Usuario_Id C# uses
 * for tbl_log_bitacora and tbl_log_general entries.
 */
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// Clear sesion data for ADMIN before test
$pdo->exec('UPDATE tbl_cat_usuarios SET Sesion_Iniciada=0');
$pdo->exec('DELETE FROM tbl_log_sesiones_activas');

// Record counts before login
$beforeBitacora = $pdo->query('SELECT MAX(Id) FROM tbl_log_bitacora')->fetchColumn();
$beforeGeneral = $pdo->query('SELECT MAX(Id) FROM tbl_log_general')->fetchColumn();
echo "Before: tbl_log_bitacora MAX_Id=$beforeBitacora, tbl_log_general MAX_Id=$beforeGeneral\n\n";

// Login ADMIN (notaria_id=11 → maps to master)
$user = DB::table('users')->where('cn_usuario_id', 1)->first(); // ADMIN
$cnRow = DB::table('tbl_cat_usuarios')->where('Id', 1)->first();
$plainPwd = decrypt($user->cn_password);
echo "Login: {$cnRow->Usuario} (Id={$cnRow->Id}) notaria_id={$user->notaria_id} pwd=$plainPwd\n";

$url = rtrim(config('services.control_notarial.internal_url'), '/').'/Login/Authentication';
$resp = Http::withoutVerifying()->timeout(15)->post($url, [
    'usuario' => $cnRow->Usuario,
    'contrasena' => $plainPwd,
    'notaria' => (string) $user->notaria_id,
    'equipo' => 'Laravel-Diag',
]);
echo "HTTP {$resp->status()}: ".substr($resp->body(), 0, 100)."...\n\n";

if ($resp->successful()) {
    // Show new log entries
    echo "=== New tbl_log_bitacora entries ===\n";
    foreach ($pdo->query('SELECT * FROM tbl_log_bitacora WHERE Id > '.($beforeBitacora ?? 0).' ORDER BY Id') as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";
    }

    echo "\n=== New tbl_log_general entries ===\n";
    foreach ($pdo->query('SELECT * FROM tbl_log_general WHERE Id > '.($beforeGeneral ?? 0).' ORDER BY Id') as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";
    }

    echo "\n=== New tbl_log_sesiones_activas entries ===\n";
    foreach ($pdo->query('SELECT * FROM tbl_log_sesiones_activas') as $r) {
        echo "  Usuario_Id={$r['Usuario_Id']} Equipo={$r['Equipo']}\n";
    }
}
