<?php
/**
 * Script para extraer la estructura de las tablas del sistema VB
 * Base de datos: sistemaatinet
 */

// Conexión local usando XAMPP
$host = 'localhost'; // o '127.0.0.1'
$database = 'sistemaatinet';
$username = 'root';
$password = ''; // XAMPP típicamente no tiene password para root

// Tablas que necesitamos analizar
$tables = [
    'clientes',
    'alarmas',
    'seguimientosventa',
    'seguimientosatencion',
    'seguimientossoporte',
    'chat',
    'chatgrupo',
    'usuarios',
    'notarias', // Si existe
];

echo "=================================================\n";
echo "EXTRAYENDO ESTRUCTURA DE BD SISTEMA VB\n";
echo "=================================================\n\n";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    echo "✅ Conexión exitosa a: $database@$host\n\n";

    // Primero, obtener todas las tablas disponibles
    echo "📋 TABLAS DISPONIBLES EN LA BASE DE DATOS:\n";
    echo str_repeat("-", 80) . "\n";

    $stmt = $pdo->query("SHOW TABLES");
    $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($allTables as $table) {
        echo "  - $table\n";
    }
    echo "\n" . str_repeat("=", 80) . "\n\n";

    // Ahora extraer estructura de las tablas que nos interesan
    foreach ($tables as $table) {
        if (!in_array($table, $allTables)) {
            echo "⚠️  TABLA NO EXISTE: $table\n\n";
            continue;
        }

        echo "📊 TABLA: $table\n";
        echo str_repeat("=", 80) . "\n\n";

        // SHOW CREATE TABLE
        echo "🔧 CREATE TABLE Statement:\n";
        echo str_repeat("-", 80) . "\n";
        $stmt = $pdo->query("SHOW CREATE TABLE `$table`");
        $createTable = $stmt->fetch();
        echo $createTable['Create Table'] . ";\n\n";

        // DESCRIBE TABLE
        echo "📝 Estructura de Columnas:\n";
        echo str_repeat("-", 80) . "\n";
        $stmt = $pdo->query("DESCRIBE `$table`");
        $columns = $stmt->fetchAll();

        printf("%-30s %-25s %-8s %-8s %-15s %-s\n",
            "FIELD", "TYPE", "NULL", "KEY", "DEFAULT", "EXTRA"
        );
        echo str_repeat("-", 80) . "\n";

        foreach ($columns as $column) {
            printf("%-30s %-25s %-8s %-8s %-15s %-s\n",
                $column['Field'],
                $column['Type'],
                $column['Null'],
                $column['Key'] ?? '',
                $column['Default'] ?? 'NULL',
                $column['Extra'] ?? ''
            );
        }

        // Contar registros
        echo "\n📈 Total de Registros: ";
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM `$table`");
        $count = $stmt->fetch();
        echo number_format($count['total']) . "\n";

        // Mostrar algunos registros de ejemplo (primeros 3)
        echo "\n🔍 Ejemplo de Datos (primeros 3 registros):\n";
        echo str_repeat("-", 80) . "\n";
        $stmt = $pdo->query("SELECT * FROM `$table` LIMIT 3");
        $examples = $stmt->fetchAll();

        if (!empty($examples)) {
            // Mostrar campos
            $fields = array_keys($examples[0]);
            echo "Campos: " . implode(", ", $fields) . "\n\n";

            foreach ($examples as $i => $row) {
                echo "Registro " . ($i + 1) . ":\n";
                foreach ($row as $key => $value) {
                    $displayValue = $value;
                    if (is_null($value)) {
                        $displayValue = 'NULL';
                    } elseif (strlen($value) > 100) {
                        $displayValue = substr($value, 0, 100) . '... [truncado]';
                    }
                    echo "  $key: $displayValue\n";
                }
                echo "\n";
            }
        } else {
            echo "  (Tabla vacía)\n\n";
        }

        echo "\n" . str_repeat("=", 80) . "\n\n\n";
    }

    // Verificar Foreign Keys
    echo "🔗 FOREIGN KEYS Y RELACIONES:\n";
    echo str_repeat("=", 80) . "\n\n";

    $stmt = $pdo->query("
        SELECT
            TABLE_NAME,
            COLUMN_NAME,
            CONSTRAINT_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = '$database'
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_NAME IN ('" . implode("','", $tables) . "')
        ORDER BY TABLE_NAME, COLUMN_NAME
    ");

    $foreignKeys = $stmt->fetchAll();

    if (!empty($foreignKeys)) {
        foreach ($foreignKeys as $fk) {
            echo "{$fk['TABLE_NAME']}.{$fk['COLUMN_NAME']} → ";
            echo "{$fk['REFERENCED_TABLE_NAME']}.{$fk['REFERENCED_COLUMN_NAME']}\n";
        }
    } else {
        echo "  (No se encontraron foreign keys explícitas)\n";
    }

    echo "\n" . str_repeat("=", 80) . "\n\n";

    echo "✅ Extracción completada exitosamente\n\n";

    // Generar archivo de salida
    $outputFile = __DIR__ . '/VB_DB_STRUCTURE.txt';
    echo "💾 Guardando resultado completo en: $outputFile\n";

} catch (PDOException $e) {
    echo "❌ ERROR de conexión:\n";
    echo "   Mensaje: " . $e->getMessage() . "\n";
    echo "   Código: " . $e->getCode() . "\n\n";

    echo "📝 Troubleshooting:\n";
    echo "   1. Verificar que el servidor MySQL esté corriendo\n";
    echo "   2. Verificar que el host 'SRVATINET' sea accesible\n";
    echo "   3. Verificar credenciales (usuario: $username)\n";
    echo "   4. Verificar que la base de datos '$database' exista\n";
    echo "   5. Verificar permisos del usuario\n\n";

    if (strpos($e->getMessage(), '2002') !== false) {
        echo "   ⚠️  Error 2002: El servidor MySQL no responde o no es accesible\n";
        echo "   Posibles causas:\n";
        echo "   - Servidor MySQL no está corriendo\n";
        echo "   - Host incorrecto (¿usar IP en lugar de nombre?)\n";
        echo "   - Firewall bloqueando conexión\n";
        echo "   - Puerto 3306 no disponible\n";
    }

    exit(1);
}
