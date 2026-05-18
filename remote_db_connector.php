<?php

/**
 * ============================================================================
 * CONECTOR REMOTO A BASES DE DATOS HOSTGATOR
 * ============================================================================
 *
 * Script PHP standalone para conectarse a las bases de datos remotas
 * de Hostgator (OFAC, SAT, Aplicativos) sin necesidad de Laravel.
 *
 * REQUISITOS:
 * - PHP 7.4+ con extensión PDO y pdo_mysql
 * - Acceso de red al servidor 162.144.6.1:3306
 *
 * USO:
 * ```php
 * require_once 'remote_db_connector.php';
 *
 * $connector = new RemoteDBConnector();
 * $results = $connector->queryOfac("SELECT * FROM SDN LIMIT 10");
 * print_r($results);
 * ```
 *
 * @version 1.0
 *
 * @date 2026-03-11
 */
class RemoteDBConnector
{
    /**
     * Configuración de conexiones remotas
     */
    private array $config = [
        'ofac' => [
            'host' => '162.144.6.1',
            'port' => 3306,
            'database' => 'atinet65_listasofac',
            'username' => 'atinet65_ucompliance',
            'password' => 'K9FT2z&E.sf)',
            'charset' => 'utf8mb4',
        ],
        'sat' => [
            'host' => '162.144.6.1',
            'port' => 3306,
            'database' => 'atinet65_listassat',
            'username' => 'atinet65_ucompliance',
            'password' => 'K9FT2z&E.sf)',
            'charset' => 'utf8mb4',
        ],
        'aplicativos' => [
            'host' => '162.144.6.1',
            'port' => 3306,
            'database' => 'atinet65_aplicativos',
            'username' => 'atinet65_ucompliance',
            'password' => 'K9FT2z&E.sf)',
            'charset' => 'utf8mb4',
        ],
        'catalogos' => [
            'host' => '162.144.6.1',
            'port' => 3306,
            'database' => 'atinet65_catalogos',
            'username' => 'atinet65_ucompliance',
            'password' => 'K9FT2z&E.sf)',
            'charset' => 'utf8mb4',
        ],
    ];

    /**
     * Conexiones PDO activas (pool de conexiones)
     */
    private array $connections = [];

    /**
     * Modo debug (imprime queries y errores)
     */
    private bool $debug = false;

    /**
     * Habilitar modo debug
     */
    public function enableDebug(): self
    {
        $this->debug = true;

        return $this;
    }

    /**
     * Deshabilitar modo debug
     */
    public function disableDebug(): self
    {
        $this->debug = false;

        return $this;
    }

    /**
     * Obtener o crear conexión a una base de datos
     *
     * @param  string  $database  Nombre de la BD: 'ofac', 'sat', 'aplicativos', 'catalogos'
     *
     * @throws Exception Si no puede conectar
     */
    public function getConnection(string $database): PDO
    {
        if (! isset($this->config[$database])) {
            throw new Exception("Base de datos '{$database}' no configurada. Opciones válidas: ".implode(', ', array_keys($this->config)));
        }

        // Reutilizar conexión si ya existe
        if (isset($this->connections[$database])) {
            return $this->connections[$database];
        }

        $config = $this->config[$database];

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $config['host'],
                $config['port'],
                $config['database'],
                $config['charset']
            );

            $pdo = new PDO(
                $dsn,
                $config['username'],
                $config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$config['charset']}",
                ]
            );

            $this->connections[$database] = $pdo;

            if ($this->debug) {
                echo "✅ Conectado a: {$config['host']}:{$config['port']}/{$config['database']}\n";
            }

            return $pdo;

        } catch (PDOException $e) {
            $error = "❌ Error conectando a {$database}: ".$e->getMessage();
            if ($this->debug) {
                echo $error."\n";
            }
            throw new Exception($error, 0, $e);
        }
    }

    /**
     * Ejecutar query en base de datos OFAC
     */
    public function queryOfac(string $sql, array $params = []): array
    {
        return $this->query('ofac', $sql, $params);
    }

    /**
     * Ejecutar query en base de datos SAT
     */
    public function querySat(string $sql, array $params = []): array
    {
        return $this->query('sat', $sql, $params);
    }

    /**
     * Ejecutar query en base de datos Aplicativos
     */
    public function queryAplicativos(string $sql, array $params = []): array
    {
        return $this->query('aplicativos', $sql, $params);
    }

    /**
     * Ejecutar query en base de datos Catálogos
     */
    public function queryCatalogos(string $sql, array $params = []): array
    {
        return $this->query('catalogos', $sql, $params);
    }

    /**
     * Ejecutar query genérica
     *
     * @param  string  $database  Nombre de la BD
     * @param  string  $sql  Query SQL (usar ? para parámetros)
     * @param  array  $params  Parámetros para la query
     * @return array Resultados
     */
    public function query(string $database, string $sql, array $params = []): array
    {
        try {
            $pdo = $this->getConnection($database);

            if ($this->debug) {
                echo "\n📋 Query en {$database}:\n";
                echo '   SQL: '.$sql."\n";
                if (! empty($params)) {
                    echo '   Params: '.json_encode($params)."\n";
                }
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll();

            if ($this->debug) {
                echo '   ✅ Resultados: '.count($results)." filas\n";
            }

            return $results;

        } catch (PDOException $e) {
            $error = '❌ Error ejecutando query: '.$e->getMessage();
            if ($this->debug) {
                echo $error."\n";
            }
            throw new Exception($error, 0, $e);
        }
    }

    /**
     * Ejecutar query y obtener solo la primera fila
     */
    public function queryOne(string $database, string $sql, array $params = []): ?array
    {
        $results = $this->query($database, $sql, $params);

        return $results[0] ?? null;
    }

    /**
     * Contar registros en una tabla
     */
    public function count(string $database, string $table, string $where = '1=1', array $params = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM `{$table}` WHERE {$where}";
        $result = $this->queryOne($database, $sql, $params);

        return (int) ($result['total'] ?? 0);
    }

    /**
     * Listar todas las tablas de una base de datos
     */
    public function getTables(string $database): array
    {
        $sql = 'SHOW TABLES';
        $results = $this->query($database, $sql);

        $tables = [];
        $tableKey = 'Tables_in_'.$this->config[$database]['database'];

        foreach ($results as $row) {
            $tables[] = $row[$tableKey];
        }

        return $tables;
    }

    /**
     * Obtener estructura de una tabla (DESCRIBE)
     */
    public function describeTable(string $database, string $table): array
    {
        $sql = "DESCRIBE `{$table}`";

        return $this->query($database, $sql);
    }

    /**
     * Test de conectividad a todas las bases de datos
     */
    public function testAllConnections(): array
    {
        $results = [];

        foreach (array_keys($this->config) as $database) {
            try {
                $pdo = $this->getConnection($database);

                // Query simple para verificar conexión
                $stmt = $pdo->query('SELECT 1 as test');
                $stmt->fetch();

                $results[$database] = [
                    'status' => 'OK',
                    'message' => 'Conectado exitosamente',
                    'server_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
                ];

            } catch (Exception $e) {
                $results[$database] = [
                    'status' => 'ERROR',
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    /**
     * Cerrar todas las conexiones
     */
    public function closeAll(): void
    {
        $this->connections = [];
        if ($this->debug) {
            echo "🔌 Todas las conexiones cerradas\n";
        }
    }

    /**
     * Destructor: cerrar conexiones
     */
    public function __destruct()
    {
        $this->closeAll();
    }
}

// ============================================================================
// EJEMPLOS DE USO
// ============================================================================

// Solo ejecutar ejemplos si se llama directamente (no cuando se hace require)
if (basename(__FILE__) === basename($_SERVER['PHP_SELF'])) {
    echo "╔════════════════════════════════════════════════════════════════╗\n";
    echo "║        CONECTOR REMOTO A BASES DE DATOS HOSTGATOR             ║\n";
    echo "╚════════════════════════════════════════════════════════════════╝\n\n";

    // Crear instancia
    $connector = new RemoteDBConnector;
    $connector->enableDebug();

    // ========================================
    // EJEMPLO 1: Test de conexiones
    // ========================================
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "EJEMPLO 1: Test de Conexiones\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    $testResults = $connector->testAllConnections();

    foreach ($testResults as $database => $result) {
        $icon = $result['status'] === 'OK' ? '✅' : '❌';
        echo "{$icon} {$database}: {$result['message']}";

        if (isset($result['server_version'])) {
            echo " (MySQL {$result['server_version']})";
        }

        echo "\n";
    }

    // ========================================
    // EJEMPLO 2: Listar tablas
    // ========================================
    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "EJEMPLO 2: Listar Tablas de BD\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    try {
        echo "📦 Tablas en OFAC:\n";
        $ofacTables = $connector->getTables('ofac');
        foreach ($ofacTables as $i => $table) {
            echo '   '.($i + 1).". {$table}\n";
        }

        echo "\n📦 Tablas en SAT:\n";
        $satTables = $connector->getTables('sat');
        foreach ($satTables as $i => $table) {
            echo '   '.($i + 1).". {$table}\n";
        }

    } catch (Exception $e) {
        echo '❌ Error: '.$e->getMessage()."\n";
    }

    // ========================================
    // EJEMPLO 3: Contar registros
    // ========================================
    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "EJEMPLO 3: Contar Registros\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    try {
        $countSdn = $connector->count('ofac', 'SDN');
        echo '📊 Total registros en OFAC.SDN: '.number_format($countSdn)."\n";

        $count69B = $connector->count('sat', '69-B');
        echo '📊 Total registros en SAT.69-B: '.number_format($count69B)."\n";

        $countConsultas = $connector->count('ofac', 'consultas');
        echo '📊 Total consultas OFAC: '.number_format($countConsultas)."\n";

    } catch (Exception $e) {
        echo '❌ Error: '.$e->getMessage()."\n";
    }

    // ========================================
    // EJEMPLO 4: Consultas parametrizadas
    // ========================================
    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "EJEMPLO 4: Consulta con Parámetros\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    try {
        // Buscar en SDN por nombre (ejemplo)
        $results = $connector->queryOfac(
            'SELECT * FROM SDN LIMIT 5'
        );

        echo "🔍 Primeros 5 registros de SDN:\n\n";
        foreach ($results as $i => $row) {
            echo '   Registro '.($i + 1).":\n";
            foreach ($row as $key => $value) {
                echo "      {$key}: {$value}\n";
            }
            echo "\n";
        }

    } catch (Exception $e) {
        echo '❌ Error: '.$e->getMessage()."\n";
    }

    // ========================================
    // EJEMPLO 5: Búsquedas legacy
    // ========================================
    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "EJEMPLO 5: Búsquedas Legacy de Notaría\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    try {
        // Contar búsquedas de notaría 10Cuernavaca
        $countOfac = $connector->count('ofac', 'consultas', 'proyecto = ?', ['10Cuernavaca']);
        $countSat = $connector->count('sat', 'consultas', 'proyecto = ?', ['10Cuernavaca']);

        echo "📊 Búsquedas legacy de 10Cuernavaca:\n";
        echo '   OFAC: '.number_format($countOfac)." consultas\n";
        echo '   SAT: '.number_format($countSat)." consultas\n";
        echo '   TOTAL: '.number_format($countOfac + $countSat)." búsquedas\n";

        // Última búsqueda
        $ultimaOfac = $connector->queryOne('ofac',
            'SELECT * FROM consultas WHERE proyecto = ? ORDER BY fecha DESC LIMIT 1',
            ['10Cuernavaca']
        );

        if ($ultimaOfac) {
            echo "\n🕐 Última búsqueda OFAC:\n";
            echo "   Fecha: {$ultimaOfac['fecha']}\n";
            echo "   Tipo: {$ultimaOfac['tipoconsulta']}\n";
        }

    } catch (Exception $e) {
        echo '❌ Error: '.$e->getMessage()."\n";
    }

    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "✅ Ejemplos completados\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
}
