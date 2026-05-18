<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$pdo = DB::getPdo();

// ==============================
// 1. activity_log (Spatie)
// ==============================
echo "=== 1. activity_log ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM activity_log')->fetchAll(PDO::FETCH_COLUMN);
echo 'Columnas: '.implode(', ', $cols)."\n";
$total = $pdo->query('SELECT COUNT(*) FROM activity_log')->fetchColumn();
echo "Total: $total\n";
if ($total > 0) {
    echo "\nÚltimos 5 registros:\n";
    $rows = $pdo->query('SELECT id, log_name, description, subject_type, event, causer_type, causer_id, created_at FROM activity_log ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo "  [{$r['created_at']}] [{$r['log_name']}] {$r['description']} | event={$r['event']} | causer={$r['causer_type']}#{$r['causer_id']}\n";
    }
    echo "\nDistribución por log_name:\n";
    $dist = $pdo->query('SELECT log_name, COUNT(*) as total FROM activity_log GROUP BY log_name ORDER BY total DESC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($dist as $r) {
        printf("  %-30s %s\n", $r['log_name'], $r['total']);
    }
    echo "\nDistribución por event:\n";
    $events = $pdo->query('SELECT event, COUNT(*) as total FROM activity_log GROUP BY event ORDER BY total DESC')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($events as $r) {
        printf("  %-20s %s\n", $r['event'] ?? 'null', $r['total']);
    }
    echo "\nHoy:\n";
    $hoy = $pdo->query('SELECT COUNT(*) FROM activity_log WHERE DATE(created_at)=CURDATE()')->fetchColumn();
    echo "  Registros hoy: $hoy\n";
}

// ==============================
// 2. tbl_log_bitacora
// ==============================
echo "\n=== 2. tbl_log_bitacora ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM tbl_log_bitacora')->fetchAll(PDO::FETCH_COLUMN);
echo 'Columnas: '.implode(', ', $cols)."\n";
$total = $pdo->query('SELECT COUNT(*) FROM tbl_log_bitacora')->fetchColumn();
echo "Total: $total\n";
if ($total > 0) {
    echo "\nÚltimos 5 registros:\n";
    $rows = $pdo->query('SELECT * FROM tbl_log_bitacora ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo '  '.json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
    }
}

// ==============================
// 3. tbl_log_general (CN - C#)
// ==============================
echo "\n=== 3. tbl_log_general (C#) ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM tbl_log_general')->fetchAll(PDO::FETCH_COLUMN);
echo 'Columnas: '.implode(', ', $cols)."\n";
$total = $pdo->query('SELECT COUNT(*) FROM tbl_log_general')->fetchColumn();
echo "Total: $total\n";
echo "\nHoy por operación:\n";
$ops = $pdo->query('SELECT Operacion, COUNT(*) as total FROM tbl_log_general WHERE DATE(Fecha_Creacion)=CURDATE() GROUP BY Operacion ORDER BY total DESC LIMIT 15')->fetchAll(PDO::FETCH_ASSOC);
foreach ($ops as $r) {
    printf("  %-35s %s\n", $r['Operacion'], $r['total']);
}
echo "\nÚltimos 5 registros:\n";
$rows = $pdo->query('SELECT * FROM tbl_log_general ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    $fecha = $r['Fecha_Creacion'] ?? '';
    $op = $r['Operacion'] ?? '';
    $user = $r['Id_Usuario'] ?? '';
    $status = $r['Estatus'] ?? '';
    echo "  [{$fecha}] [{$op}] usuario={$user} status={$status}\n";
}

// ==============================
// 4. tbl_log_sesiones_activas
// ==============================
echo "\n=== 4. tbl_log_sesiones_activas ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM tbl_log_sesiones_activas')->fetchAll(PDO::FETCH_COLUMN);
echo 'Columnas: '.implode(', ', $cols)."\n";
$total = $pdo->query('SELECT COUNT(*) FROM tbl_log_sesiones_activas')->fetchColumn();
echo "Total sesiones activas: $total\n";
if ($total > 0) {
    echo "\nRegistros:\n";
    $rows = $pdo->query('SELECT * FROM tbl_log_sesiones_activas ORDER BY id DESC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo '  '.json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
    }
}
