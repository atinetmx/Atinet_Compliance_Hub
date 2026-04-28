<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$pdo = DB::getPdo();

echo "=== ExceptionExecuted HOY ===\n";
$rows = $pdo->query("
    SELECT Id, Usuario_Id, Operacion, Descripcion, Datos, Estatus, Equipo, Fecha_Creacion
    FROM tbl_log_general
    WHERE Operacion = 'ExceptionExecuted'
    AND DATE(Fecha_Creacion) = CURDATE()
    ORDER BY Id DESC
")->fetchAll(PDO::FETCH_ASSOC);

echo 'Total hoy: '.count($rows)."\n\n";
foreach ($rows as $i => $r) {
    echo '--- Excepción #'.($i + 1)." [ID:{$r['Id']}] [{$r['Fecha_Creacion']}] ---\n";
    echo "  Usuario_Id : {$r['Usuario_Id']}\n";
    echo "  Descripcion: {$r['Descripcion']}\n";
    echo "  Estatus    : {$r['Estatus']}\n";
    echo "  Equipo     : {$r['Equipo']}\n";
    // Datos puede ser JSON largo, mostrarlo formateado
    if (! empty($r['Datos'])) {
        $decoded = json_decode($r['Datos'], true);
        if ($decoded) {
            echo "  Datos:\n";
            foreach ($decoded as $k => $v) {
                $v = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
                echo "    $k: ".substr((string) $v, 0, 300)."\n";
            }
        } else {
            echo '  Datos: '.substr($r['Datos'], 0, 500)."\n";
        }
    }
    echo "\n";
}

echo "=== ExceptionExecuted ÚLTIMOS 7 DÍAS (resumen) ===\n";
$resumen = $pdo->query("
    SELECT DATE(Fecha_Creacion) as dia, COUNT(*) as total
    FROM tbl_log_general
    WHERE Operacion = 'ExceptionExecuted'
    AND Fecha_Creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(Fecha_Creacion)
    ORDER BY dia DESC
")->fetchAll(PDO::FETCH_ASSOC);
foreach ($resumen as $r) {
    printf("  %s: %s excepciones\n", $r['dia'], $r['total']);
}
