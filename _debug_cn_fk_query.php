<?php

/**
 * Captura las queries MySQL de C# usando general_log
 * para identificar qué Usuario_Id usa al INSERT en tbl_log_bitacora.
 */
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// 1. Habilitar general_log
echo "=== 1. Habilitando general_log ===\n";
try {
    // Obtener ruta actual del log
    $logRow = $masterPdo->query("SHOW VARIABLES LIKE 'general_log_file'")->fetch();
    $logFile = $logRow ? $logRow[1] : '';
    echo "general_log_file actual: $logFile\n";
    $masterPdo->exec("SET GLOBAL general_log = 'ON'");
    echo "general_log = ON\n";
} catch (PDOException $e) {
    echo "ERROR: {$e->getMessage()}\n";
}

// 2. Limpiar sesiones de tenant
echo "\n=== 2. Limpiando sesiones tenant atinet_edomex_notaria_11 ===\n";
$tenantPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$tenantPdo->exec('UPDATE tbl_cat_usuarios SET Sesion_Iniciada=0');
$tenantPdo->exec('DELETE FROM tbl_log_sesiones_activas');
echo "Sesiones limpiadas\n";

// 3. Obtener usuario PANFILOP
$user = DB::table('users')->where('cn_usuario_id', 10)->first();
$cnRow = DB::table('tbl_cat_usuarios')->where('Id', 10)->first();
$plainPwd = decrypt($user->cn_password);
echo "\nUsuario: {$cnRow->Usuario} Id={$cnRow->Id}, notaria_id={$user->notaria_id}\n";
echo "pwd_plain: $plainPwd\n";

// 4. Marcar timestamp antes de la llamada
$timestamp = date('Y-m-d H:i:s');
echo "\n=== 3. Llamando C# API (timestamp=$timestamp) ===\n";
$url = rtrim(config('services.control_notarial.internal_url'), '/').'/Login/Authentication';
$payload = [
    'usuario' => $cnRow->Usuario,
    'contrasena' => $plainPwd,
    'notaria' => (string) $user->notaria_id,
    'equipo' => 'Laravel-Diag',
];
echo 'Payload: '.json_encode($payload)."\n";
$resp = Http::withoutVerifying()->timeout(15)->post($url, $payload);
echo "HTTP {$resp->status()}: ".$resp->body()."\n";

// 5. Deshabilitar general_log para evitar acumulación
$masterPdo->exec("SET GLOBAL general_log = 'OFF'");
echo "\ngeneral_log = OFF\n";

// 6. Leer el log de MySQL
echo "\n=== 4. Leyendo general_log ===\n";
$logRow = $masterPdo->query("SHOW VARIABLES LIKE 'general_log_file'")->fetch();
$logFile = $logRow ? $logRow[1] : 'C:/ProgramData/MySQL/MySQL Server 8.0/Data/mysql_general.log';
echo "Leyendo: $logFile\n";

if (file_exists($logFile)) {
    $allLines = file($logFile);
    // Filtrar líneas después del timestamp y con tbl_log o INSERT
    $inScope = false;
    $relevant = [];
    foreach ($allLines as $line) {
        if (stripos($line, 'Laravel-Diag') !== false || strpos($line, $timestamp) !== false) {
            $inScope = true;
        }
        if ($inScope) {
            $relevant[] = trim($line);
        }
    }
    foreach (array_slice($relevant, 0, 80) as $line) {
        echo $line."\n";
    }
} else {
    echo "No se encontró el archivo general_log en: $logFile\n";
    echo "Buscar con: SHOW VARIABLES LIKE 'general_log%'\n";
    $vars = $masterPdo->query("SHOW VARIABLES LIKE 'general_log%'")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($vars as $v) {
        echo "  {$v['Variable_name']} = {$v['Value']}\n";
    }
}
