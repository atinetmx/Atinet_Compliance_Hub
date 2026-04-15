<?php

echo "=================================================\n";
echo "PROBANDO CONEXIONES AL SERVIDOR MYSQL\n";
echo "=================================================\n\n";

$configurations = [
    [
        'name' => 'Localhost',
        'host' => 'localhost',
        'port' => '3306',
    ],
    [
        'name' => '127.0.0.1',
        'host' => '127.0.0.1',
        'port' => '3306',
    ],
    [
        'name' => 'SRVATINET',
        'host' => 'SRVATINET',
        'port' => '3306',
    ],
    [
        'name' => 'IP Online',
        'host' => '192.185.226.133',
        'port' => '3306',
    ],
];

$username = 'root';
$password = '123456';

foreach ($configurations as $config) {
    echo "🔄 Probando: {$config['name']} ({$config['host']}:{$config['port']})\n";
    echo str_repeat('-', 60) . "\n";
    
    try {
        $dsn = "mysql:host={$config['host']};port={$config['port']};charset=utf8mb4";
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        
        echo "✅ CONEXIÓN EXITOSA!\n";
        
        // Obtener versión de MySQL
        $version = $pdo->query('SELECT VERSION()')->fetchColumn();
        echo "   📌 Versión MySQL: $version\n";
        
        // Listar bases de datos
        $stmt = $pdo->query('SHOW DATABASES');
        $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "   📂 Bases de datos disponibles (" . count($databases) . "):\n";
        foreach ($databases as $db) {
            $highlight = (stripos($db, 'atinet') !== false || stripos($db, 'sistema') !== false) ? ' ⭐' : '';
            echo "      - $db$highlight\n";
        }
        
        // Verificar si existe sistemaatinet
        if (in_array('sistemaatinet', $databases)) {
            echo "\n   ✅ Base de datos 'sistemaatinet' ENCONTRADA!\n";
            
            // Conectar a sistemaatinet y listar tablas
            $pdo->exec('USE sistemaatinet');
            $stmt = $pdo->query('SHOW TABLES');
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo "   📋 Tablas en sistemaatinet (" . count($tables) . "):\n";
            $crm_tables = ['clientes', 'alarmas', 'seguimientosventa', 'seguimientosatencion', 
                          'seguimientossoporte', 'chat', 'chatgrupo', 'usuarios'];
            
            foreach ($tables as $table) {
                $highlight = in_array($table, $crm_tables) ? ' ⭐ (CRM)' : '';
                echo "      - $table$highlight\n";
            }
        } else if (in_array('atinet65_sistemaatinet', $databases)) {
            echo "\n   ✅ Base de datos 'atinet65_sistemaatinet' ENCONTRADA!\n";
        }
        
        echo "\n✨ ESTA ES LA CONFIGURACIÓN CORRECTA:\n";
        echo "   Host: {$config['host']}\n";
        echo "   Puerto: {$config['port']}\n";
        echo "   Usuario: $username\n";
        echo "   Password: $password\n\n";
        
        // Si encontramos una conexión exitosa, salimos
        exit(0);
        
    } catch (PDOException $e) {
        echo "❌ Error: {$e->getMessage()}\n";
        echo "   Código: {$e->getCode()}\n\n";
    }
}

echo "\n❌ NO SE PUDO ESTABLECER CONEXIÓN CON NINGUNA CONFIGURACIÓN\n";
echo "\n📝 Posibles soluciones:\n";
echo "   1. Verificar que XAMPP MySQL esté corriendo\n";
echo "   2. Verificar usuario/contraseña en phpMyAdmin\n";
echo "   3. Revisar puerto en XAMPP Control Panel\n";
echo "   4. Verificar que no haya firewall bloqueando\n\n";

exit(1);
