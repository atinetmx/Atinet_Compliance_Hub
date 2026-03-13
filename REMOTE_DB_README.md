# 📡 Conector Remoto a Bases de Datos Hostgator

Script PHP standalone para conectarse a las bases de datos remotas de Hostgator (OFAC, SAT, Aplicativos) sin necesidad de Laravel ni frameworks.

## 📋 Requisitos

- **PHP 7.4+** con extensiones:
  - `pdo`
  - `pdo_mysql`
- Acceso de red al servidor: `162.144.6.1:3306`

## 🚀 Instalación

1. Copiar el archivo `remote_db_connector.php` a tu sistema
2. No requiere composer ni dependencias
3. Listo para usar

## 🔐 Credenciales

Todas las conexiones usan las mismas credenciales:

```
Host: 162.144.6.1
Port: 3306
Usuario: atinet65_ucompliance
Password: K9FT2z&E.sf)
```

**Bases de datos disponibles:**
- `atinet65_listasofac` → Listas OFAC (11 tablas)
- `atinet65_listassat` → Listas SAT 69-B (4 tablas)
- `atinet65_aplicativos` → Búsquedas legacy y usuarios (10+ tablas)

## 📖 Uso Básico

### Modo 1: Ejecutar el script directamente (con ejemplos)

```bash
php remote_db_connector.php
```

Esto ejecutará 5 ejemplos automáticamente:
1. Test de conexiones
2. Listar tablas
3. Contar registros
4. Consultas parametrizadas
5. Búsquedas legacy de notarías

### Modo 2: Usar como librería en tu código

```php
<?php
require_once 'remote_db_connector.php';

// Crear conector
$connector = new RemoteDBConnector();

// Opcional: habilitar debug
$connector->enableDebug();

// Hacer consultas
$results = $connector->queryOfac("SELECT * FROM SDN LIMIT 10");
print_r($results);
```

## 🎯 Ejemplos de Uso

### 1. Test de Conexión

```php
$connector = new RemoteDBConnector();
$testResults = $connector->testAllConnections();

foreach ($testResults as $database => $result) {
    echo "{$database}: {$result['status']} - {$result['message']}\n";
}
```

**Output:**
```
ofac: OK - Conectado exitosamente (MySQL 5.7.23)
sat: OK - Conectado exitosamente (MySQL 5.7.23)
aplicativos: OK - Conectado exitosamente (MySQL 5.7.23)
```

### 2. Listar Tablas de una Base de Datos

```php
$connector = new RemoteDBConnector();

// Tablas de OFAC
$tables = $connector->getTables('ofac');
print_r($tables);
// Array: [ADD, ALT, CONS_ADD, CONS_ALT, CONS_SDN, Nombres, SDN, Version, consultas, ...]

// Tablas de SAT
$tables = $connector->getTables('sat');
print_r($tables);
// Array: [69-B, 69-C, Version, consultas]
```

### 3. Contar Registros

```php
$connector = new RemoteDBConnector();

// Total de registros en una tabla
$total = $connector->count('ofac', 'SDN');
echo "Total registros OFAC.SDN: " . number_format($total);
// Output: Total registros OFAC.SDN: 14,980

// Contar con condición
$total = $connector->count('ofac', 'consultas', 'proyecto = ?', ['10Cuernavaca']);
echo "Búsquedas de 10Cuernavaca: {$total}";
// Output: Búsquedas de 10Cuernavaca: 16,941
```

### 4. Consultas Simples

```php
$connector = new RemoteDBConnector();

// Query simple
$results = $connector->queryOfac("SELECT * FROM SDN LIMIT 5");

foreach ($results as $row) {
    echo $row['SDN_Name'] . "\n";
}
```

### 5. Consultas Parametrizadas (Seguras contra SQL Injection)

```php
$connector = new RemoteDBConnector();

// Buscar por nombre
$nombre = "BANCO NACIONAL";
$results = $connector->queryOfac(
    "SELECT * FROM SDN WHERE SDN_Name LIKE ? LIMIT 10",
    ["%{$nombre}%"]
);

print_r($results);
```

### 6. Obtener Solo la Primera Fila

```php
$connector = new RemoteDBConnector();

$result = $connector->queryOne(
    'ofac',
    "SELECT * FROM consultas WHERE proyecto = ? ORDER BY fecha DESC LIMIT 1",
    ['10Cuernavaca']
);

echo "Última búsqueda: {$result['fecha']}";
// Output: Última búsqueda: 2026-03-11 17:22:43
```

### 7. Consultar Estructura de Tabla (DESCRIBE)

```php
$connector = new RemoteDBConnector();

$structure = $connector->describeTable('ofac', 'SDN');

foreach ($structure as $column) {
    echo "{$column['Field']} ({$column['Type']})\n";
}
```

**Output:**
```
Myid (int(11))
ent_num (int(11))
SDN_Name (varchar(350))
SDN_Type (varchar(12))
Program (varchar(200))
...
```

### 8. Búsquedas Legacy Consolidadas

```php
$connector = new RemoteDBConnector();

$notaria = '10Cuernavaca';

// Contar búsquedas OFAC
$ofacCount = $connector->count('ofac', 'consultas', 'proyecto = ?', [$notaria]);

// Contar búsquedas SAT
$satCount = $connector->count('sat', 'consultas', 'proyecto = ?', [$notaria]);

// Total
$total = $ofacCount + $satCount;

echo "Búsquedas totales de {$notaria}: " . number_format($total);
// Output: Búsquedas totales de 10Cuernavaca: 48,358

// Última búsqueda
$ultimaOfac = $connector->queryOne('ofac',
    "SELECT * FROM consultas WHERE proyecto = ? ORDER BY fecha DESC LIMIT 1",
    [$notaria]
);

echo "Última búsqueda OFAC: {$ultimaOfac['fecha']}";
```

### 9. Usar Múltiples Bases de Datos

```php
$connector = new RemoteDBConnector();

// OFAC
$ofacResults = $connector->queryOfac("SELECT * FROM SDN LIMIT 5");

// SAT
$satResults = $connector->querySat("SELECT * FROM `69-B` LIMIT 5");

// Aplicativos
$aplicativosResults = $connector->queryAplicativos("SELECT * FROM registro LIMIT 5");

// Método genérico
$results = $connector->query('ofac', "SELECT * FROM SDN LIMIT 5");
```

### 10. Modo Debug (Ver Queries Ejecutadas)

```php
$connector = new RemoteDBConnector();
$connector->enableDebug();

$results = $connector->queryOfac("SELECT * FROM SDN LIMIT 3");
```

**Output:**
```
✅ Conectado a: 162.144.6.1:3306/atinet65_listasofac

📋 Query en ofac:
   SQL: SELECT * FROM SDN LIMIT 3
   ✅ Resultados: 3 filas
```

## 📊 Tablas Disponibles

### OFAC (atinet65_listasofac) - 11 tablas

| Tabla | Descripción | Registros |
|-------|-------------|-----------|
| `SDN` | Specially Designated Nationals | ~14,980 |
| `ALT` | Nombres alternativos | ~13,500 |
| `ADD` | Direcciones | ~15,000 |
| `CONS_SDN` | Consolidado SDN | Variable |
| `CONS_ALT` | Consolidado ALT | Variable |
| `CONS_ADD` | Consolidado ADD | Variable |
| `Nombres` | Índice de nombres | ~50,000 |
| `Nombres2` | Índice auxiliar | Variable |
| `Version` | Control de versión | 1 |
| `consultas` | Log de búsquedas | ~142,814 |
| `sat_69_B` | Copia SAT (legacy) | Variable |

### SAT (atinet65_listassat) - 4 tablas

| Tabla | Descripción | Registros |
|-------|-------------|-----------|
| `69-B` | Lista 69-B contribuyentes | ~14,235 |
| `69-C` | Lista 69-C sentencias | Variable |
| `Version` | Control de versión | 1 |
| `consultas` | Log de búsquedas | ~157,000 |

### Aplicativos (atinet65_aplicativos) - 10+ tablas

| Tabla | Descripción |
|-------|-------------|
| `registro` | Notarías registradas |
| `usuario` | Usuarios del sistema legacy |
| `busquedas` | Búsquedas web (MAYÚSCULAS) |
| `busquedas_escritorio` | Búsquedas desktop |
| `agenda` | Agenda/contactos |
| ...más tablas... |

## ⚠️ Notas Importantes

1. **Catálogos**: La conexión a `atinet65_catalogos` no tiene permisos con estas credenciales. Si necesitas acceso, solicitar credenciales específicas.

2. **Columnas MAYÚSCULAS**: Las tablas de `aplicativos.busquedas` y `busquedas_escritorio` usan columnas en MAYÚSCULAS:
   ```php
   // Correcto:
   SELECT USER, TIPO_BUSQUEDA, NOMBRE, FECHA FROM busquedas

   // Incorrecto:
   SELECT user, tipo_busqueda, nombre, fecha FROM busquedas
   ```

3. **Caracteres Especiales**: La tabla SAT usa guión en el nombre:
   ```php
   // Correcto:
   SELECT * FROM `69-B`

   // Incorrecto:
   SELECT * FROM 69-B
   ```

4. **Pool de Conexiones**: El conector reutiliza conexiones automáticamente. No es necesario crear múltiples instancias.

5. **Seguridad**: Usa siempre consultas parametrizadas (con `?`) para evitar SQL injection:
   ```php
   // ✅ Seguro
   $connector->query('ofac', "SELECT * FROM SDN WHERE SDN_Name = ?", [$nombre]);

   // ❌ Inseguro
   $connector->query('ofac', "SELECT * FROM SDN WHERE SDN_Name = '{$nombre}'");
   ```

## 🔧 Solución de Problemas

### Error: "Access denied for user"

**Causa**: Credenciales incorrectas o IP bloqueada

**Solución**:
1. Verificar credenciales en el código
2. Asegurar acceso al puerto 3306 (firewall)
3. Verificar que la IP tenga acceso remoto habilitado en Hostgator

### Error: "Table doesn't exist"

**Causa**: Nombre de tabla incorrecto o BD equivocada

**Solución**:
```php
// Listar tablas disponibles
$tables = $connector->getTables('ofac');
print_r($tables);
```

### Error: "PDO extension not found"

**Causa**: PHP sin extensión PDO

**Solución**:
```bash
# Ubuntu/Debian
sudo apt-get install php-mysql

# Windows (descomentar en php.ini)
extension=pdo_mysql
```

## 📝 Casos de Uso Comunes

### Verificar si un nombre está en OFAC

```php
$connector = new RemoteDBConnector();

function buscarEnOfac($nombre) {
    global $connector;

    $results = $connector->queryOfac(
        "SELECT * FROM SDN WHERE SDN_Name LIKE ? LIMIT 10",
        ["%{$nombre}%"]
    );

    return count($results) > 0 ? $results : null;
}

$encontrado = buscarEnOfac("BANCO NACIONAL");
if ($encontrado) {
    echo "⚠️  Encontrado en lista OFAC\n";
    print_r($encontrado);
} else {
    echo "✅ No encontrado en lista OFAC\n";
}
```

### Obtener estadísticas de notaría

```php
$connector = new RemoteDBConnector();

function getEstadisticasNotaria($notariaId) {
    global $connector;

    $ofac = $connector->count('ofac', 'consultas', 'proyecto = ?', [$notariaId]);
    $sat = $connector->count('sat', 'consultas', 'proyecto = ?', [$notariaId]);

    $primeraOfac = $connector->queryOne('ofac',
        "SELECT MIN(fecha) as primera FROM consultas WHERE proyecto = ?",
        [$notariaId]
    );

    $ultimaOfac = $connector->queryOne('ofac',
        "SELECT MAX(fecha) as ultima FROM consultas WHERE proyecto = ?",
        [$notariaId]
    );

    return [
        'notaria' => $notariaId,
        'total_busquedas' => $ofac + $sat,
        'busquedas_ofac' => $ofac,
        'busquedas_sat' => $sat,
        'primera_busqueda' => $primeraOfac['primera'],
        'ultima_busqueda' => $ultimaOfac['ultima'],
    ];
}

$stats = getEstadisticasNotaria('10Cuernavaca');
print_r($stats);
```

## 📞 Soporte

Para preguntas o problemas:
1. Revisar esta documentación
2. Ejecutar `php remote_db_connector.php --test` para verificar conexiones
3. Habilitar modo debug: `$connector->enableDebug()`

---

**Última actualización**: 11 de Marzo 2026
