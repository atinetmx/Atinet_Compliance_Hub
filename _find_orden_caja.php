<?php

// Buscar en qué tabla está Orden_Caja en el tenant funcional
$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', 'Atinet2026#Secure');
$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

echo "Buscando columna Orden_Caja en atinet_edomex_notaria_11...\n";
foreach ($tables as $t) {
    $cols = $pdo->query("SHOW COLUMNS FROM `{$t}`")->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('Orden_Caja', $cols)) {
        echo "  ENCONTRADA en tabla: {$t}\n";
        // Mostrar definicion completa
        $def = $pdo->query("SHOW COLUMNS FROM `{$t}` LIKE 'Orden_Caja'")->fetch(PDO::FETCH_ASSOC);
        print_r($def);
    }
}

// Ahora verificar si existe en atinet_compliance_hub
echo "\nVerificando en atinet_compliance_hub...\n";
$master = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
foreach ($tables as $t) {
    $stmt = $master->query("SHOW COLUMNS FROM `{$t}` LIKE 'Orden_Caja'");
    if ($stmt) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            echo "  EXISTE en master tabla: {$t}\n";
        }
    }
}
echo "FIN\n";
