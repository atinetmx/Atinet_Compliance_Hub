<?php

/**
 * Test directo: intentar INSERT en tbl_log_general del tenant con diferentes Usuario_Id
 * para confirmar cuál falla y cuál no.
 */
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "IDs existentes en tbl_cat_usuarios:\n";
foreach ($pdo->query('SELECT Id, Usuario FROM tbl_cat_usuarios ORDER BY Id') as $r) {
    echo "  Id={$r['Id']} {$r['Usuario']}\n";
}

echo "\nTest INSERT con diferentes Usuario_Id:\n";
$testIds = [1, 2, 6, 7, 8, 10, 17, 18, 21];
foreach ($testIds as $id) {
    $pdo->beginTransaction();
    try {
        $pdo->prepare("INSERT INTO tbl_log_general (Usuario_Id, Operacion, Descripcion, Estatus, Equipo) VALUES (?, 'Test', 'Test', 'OK', 'diag')")->execute([$id]);
        $pdo->rollBack(); // Revertir para no contaminar
        echo "  Id=$id → ✓ INSERT OK\n";
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo "  Id=$id → ✗ FALLA: {$e->getMessage()}\n";
    }
}
