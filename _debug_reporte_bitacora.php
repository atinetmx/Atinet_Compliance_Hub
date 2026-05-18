<?php

// _check_logs_cn.php - Diagnóstico de saturación de logs C#

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$pdo = DB::getPdo();

// Total general
$total = $pdo->query('SELECT COUNT(*) FROM tbl_log_general')->fetchColumn();
echo "Total registros tbl_log_general: $total\n\n";

// Top operaciones
echo "Top 15 operaciones mas frecuentes:\n";
$rows = $pdo->query('SELECT Operacion, COUNT(*) as total FROM tbl_log_general GROUP BY Operacion ORDER BY total DESC LIMIT 15')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    printf("  %-35s %s\n", $r['Operacion'], $r['total']);
}

echo "\nLogins por dia (ultimos 10 dias):\n";
$logins = $pdo->query("SELECT DATE(Fecha_Creacion) as dia, COUNT(*) as total FROM tbl_log_general WHERE Operacion='Login' GROUP BY DATE(Fecha_Creacion) ORDER BY dia DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
foreach ($logins as $r) {
    printf("  %s: %s logins\n", $r['dia'], $r['total']);
}

echo "\nRegistros de hoy por hora:\n";
$horas = $pdo->query('SELECT HOUR(Fecha_Creacion) as hora, COUNT(*) as total FROM tbl_log_general WHERE DATE(Fecha_Creacion)=CURDATE() GROUP BY HOUR(Fecha_Creacion) ORDER BY hora')->fetchAll(PDO::FETCH_ASSOC);
foreach ($horas as $r) {
    printf("  %02d:00 -> %s registros\n", $r['hora'], $r['total']);
}

// tbl_log_sesiones_activas
echo "\ntbl_log_sesiones_activas:\n";
$sesiones = $pdo->query('SELECT COUNT(*) FROM tbl_log_sesiones_activas')->fetchColumn();
echo "  Total: $sesiones\n";

$svc = app(\App\Services\ControlNotarialApiService::class);
$token = $svc->getGatewayToken();
$url = config('services.control_notarial.internal_url');

echo "URL base: $url\n";
echo 'Token obtenido: '.(empty($token) ? 'NO' : 'SÍ')."\n\n";

// Test 1: userId=0 (todos)
$res = \Illuminate\Support\Facades\Http::withoutVerifying()
    ->timeout(15)
    ->withToken($token)
    ->get($url.'/Bitacora/GenerateReporteBitacora', [
        'userId' => 0,
        'fechaInicio' => '2026/04/23',
        'fechaFin' => '2026/04/23',
    ]);

echo 'STATUS: '.$res->status()."\n";
$body = $res->body();
// Si es PDF el body será binario, mostrar solo primeros 500 chars
if (str_starts_with($body, '%PDF') || $res->header('Content-Type') === 'application/pdf') {
    echo 'BODY: [PDF binario, '.strlen($body)." bytes]\n";
} else {
    echo 'BODY: '.substr($body, 0, 1000)."\n";
}

echo "\nContent-Type: ".$res->header('Content-Type')."\n";
