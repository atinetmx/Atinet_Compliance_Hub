<?php

/**
 * Test definitivo: eliminar FK constraints en tenant temporalmente,
 * hacer login de PANFILOP vía C#, capturar qué Usuario_Id usa C#,
 * luego restaurar constraints.
 */
$tenantDb = 'atinet_edomex_notaria_11';
$pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$tenantDb};charset=utf8mb4",
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "=== DIAGNÓSTICO FK DEFINITIVO ===\n\n";

// 1. Resetear sesiones en tenant
$pdo->exec('UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0');
echo "✓ Sesiones reseteadas\n";

// 2. Limpiar logs
$pdo->exec('DELETE FROM tbl_log_general');
$pdo->exec('DELETE FROM tbl_log_bitacora');
echo "✓ Logs limpiados\n";

// 3. Eliminar FK constraints para que C# pueda insertar cualquier Id
$pdo->exec('ALTER TABLE tbl_log_general DROP FOREIGN KEY tbl_log_general_usuario_id_foreign');
$pdo->exec('ALTER TABLE tbl_log_bitacora DROP FOREIGN KEY tbl_log_bitacora_usuario_id_foreign');
echo "✓ FK constraints eliminados temporalmente\n\n";

// 4. Hacer el login vía HTTP a C# con PANFILOP
$url = 'http://192.168.1.1:5000/api/Login/Authentication';
$payload = json_encode([
    'notaria' => '1',
    'usuario' => 'PANFILOP',
    'contrasena' => 'admin123',
    'equipo' => 'TEST_FK_DIAG',
]);

echo "Llamando C# API con PANFILOP (notaria=1)...\n";
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: */*'],
    CURLOPT_TIMEOUT => 15,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "  HTTP $code\n";
$decoded = json_decode($resp, true);
if ($decoded && isset($decoded['token'])) {
    echo "  ✓ LOGIN EXITOSO\n";
} else {
    echo "  Respuesta: $resp\n";
}

// 5. VER QUÉ INSERTÓ C# — ESTO ES LO CLAVE
echo "\n== QUÉ INSERTÓ C# EN tbl_log_general ==\n";
$rows = $pdo->query('SELECT * FROM tbl_log_general ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
if ($rows) {
    foreach ($rows as $r) {
        echo "  Usuario_Id={$r['Usuario_Id']} Operacion={$r['Operacion']} Estatus=".($r['Estatus'] ?? 'N/A')."\n";
    }
} else {
    echo "  (vacío — C# no llegó a insertar)\n";
}

echo "\n== QUÉ INSERTÓ C# EN tbl_log_bitacora ==\n";
$rows = $pdo->query('SELECT * FROM tbl_log_bitacora ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
if ($rows) {
    foreach ($rows as $r) {
        echo "  Usuario_Id={$r['Usuario_Id']} Operacion={$r['Operacion']}\n";
    }
} else {
    echo "  (vacío)\n";
}

echo "\n== tbl_cat_usuarios (IDs existentes en tenant) ==\n";
foreach ($pdo->query('SELECT Id, Usuario FROM tbl_cat_usuarios ORDER BY Id') as $r) {
    echo "  Id={$r['Id']} {$r['Usuario']}\n";
}

// 6. Restaurar FK constraints
echo "\n--- Restaurando FK constraints ---\n";
$pdo->exec('ALTER TABLE tbl_log_general ADD CONSTRAINT tbl_log_general_usuario_id_foreign FOREIGN KEY (Usuario_Id) REFERENCES tbl_cat_usuarios (Id)');
$pdo->exec('ALTER TABLE tbl_log_bitacora ADD CONSTRAINT tbl_log_bitacora_usuario_id_foreign FOREIGN KEY (Usuario_Id) REFERENCES tbl_cat_usuarios (Id)');
echo "✓ FK constraints restaurados\n";
