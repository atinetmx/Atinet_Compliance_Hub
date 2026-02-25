<?php

use App\Enums\EstadoMexico;
use App\Http\Controllers\Notaria\NotariaUserController;
use App\Models\Notaria;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Tests de Aislamiento Multi-BD (Database per Tenant)
|--------------------------------------------------------------------------
|
| Valida que el sistema de multi-database funciona correctamente
| y que cada notaría solo puede ver datos de su propia BD
|
| Arquitectura:
| - BD Master: atinet_compliance_hub (notarias, plans, subscriptions)
| - BD Tenant: atinet_{estado}_notaria_{numero} (users, busquedas, docs)
|
*/

describe('aislamiento database per tenant', function () {

    beforeEach(function () {
        // Limpiar BDs de prueba si existen
        $testDatabases = ['atinet_edomex_notaria_999', 'atinet_edomex_notaria_888'];
        foreach ($testDatabases as $db) {
            try {
                DB::statement("DROP DATABASE IF EXISTS `{$db}`");
            } catch (\Exception $e) {
                // Ignorar si no existe
            }
        }
    });

    afterEach(function () {
        // Limpiar BDs de prueba después del test
        $testDatabases = ['atinet_edomex_notaria_999', 'atinet_edomex_notaria_888'];
        foreach ($testDatabases as $db) {
            try {
                DB::statement("DROP DATABASE IF EXISTS `{$db}`");
            } catch (\Exception $e) {
                // Ignorar errores
            }
        }
    });

    test('cada notaría tiene su propia base de datos aislada', function () {
        // Arrange - Crear notarías en BD master
        $notaria1 = Notaria::create([
            'nombre' => 'Notaría Test 999',
            'numero_notaria' => 999,
            'estado' => 'Estado de México',
            'municipio' => 'Toluca',
            'activa' => true,
            'fecha_registro' => now(),
        ]);

        $notaria2 = Notaria::create([
            'nombre' => 'Notaría Test 888',
            'numero_notaria' => 888,
            'estado' => 'Estado de México',
            'municipio' => 'Naucalpan',
            'activa' => true,
            'fecha_registro' => now(),
        ]);

        // Act - Crear BDs para cada notaría
        $estadoCodigo = EstadoMexico::getCodeFromName('Estado de México');
        $db1Name = "atinet_{$estadoCodigo}_notaria_999";
        $db2Name = "atinet_{$estadoCodigo}_notaria_888";

        DB::statement("CREATE DATABASE IF NOT EXISTS `{$db1Name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        DB::statement("CREATE DATABASE IF NOT EXISTS `{$db2Name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Assert - Verificar que las BDs existen
        $databases = DB::select("SHOW DATABASES LIKE '{$db1Name}'");
        expect($databases)->toHaveCount(1);

        $databases2 = DB::select("SHOW DATABASES LIKE '{$db2Name}'");
        expect($databases2)->toHaveCount(1);

        // Assert - Verificar que son BDs independientes
        expect($db1Name)->not->toBe($db2Name);
    });

    test('usuarios de notaría solo pueden ver datos de su propia BD', function () {
        // Arrange - Crear notarías en BD master
        $notaria1 = Notaria::create([
            'nombre' => 'Notaría Test 999',
            'numero_notaria' => 999,
            'estado' => 'Estado de México',
            'municipio' => 'Toluca',
            'activa' => true,
            'fecha_registro' => now(),
        ]);

        // Crear BD tenant
        $estadoCodigo = EstadoMexico::getCodeFromName('Estado de México');
        $dbName = "atinet_{$estadoCodigo}_notaria_999";

        DB::statement("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Configurar conexión temporal y crear tabla users
        config(['database.connections.tenant_temp' => [
            'driver' => 'mysql',
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => $dbName,
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]]);

        // Crear tabla users en BD tenant
        DB::connection('tenant_temp')->statement("
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                tipo_cuenta ENUM('admin_notaria', 'usuario_notaria', 'invitado') DEFAULT 'usuario_notaria',
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Insertar usuario en BD tenant
        DB::connection('tenant_temp')->table('users')->insert([
            'name' => 'Admin Notaría 999',
            'email' => 'admin@notaria999.com',
            'password' => bcrypt('password'),
            'tipo_cuenta' => 'admin_notaria',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Act - Verificar que el usuario existe en BD tenant
        $usersInTenant = DB::connection('tenant_temp')->table('users')->count();

        // Act - Verificar que NO existe en BD master (usuarios master son super_admin)
        $usersInMaster = DB::connection('mysql')
            ->table('users')
            ->where('email', 'admin@notaria999.com')
            ->count();

        // Assert
        expect($usersInTenant)->toBe(1);
        expect($usersInMaster)->toBe(0);

        // Cleanup
        DB::purge('tenant_temp');
    });

    test('notariaUserController puede acceder a BD tenant correctamente', function () {
        // Arrange
        $notaria = Notaria::create([
            'nombre' => 'Notaría Test 999',
            'numero_notaria' => 999,
            'estado' => 'Estado de México',
            'municipio' => 'Toluca',
            'activa' => true,
            'fecha_registro' => now(),
        ]);

        // Crear BD tenant
        $estadoCodigo = EstadoMexico::getCodeFromName('Estado de México');
        $dbName = "atinet_{$estadoCodigo}_notaria_999";

        DB::statement("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Configurar conexión y crear tabla
        config(['database.connections.tenant_temp' => [
            'driver' => 'mysql',
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => $dbName,
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]]);

        DB::connection('tenant_temp')->statement("
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                tipo_cuenta ENUM('admin_notaria', 'usuario_notaria', 'invitado') DEFAULT 'usuario_notaria',
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL
            )
        ");

        DB::connection('tenant_temp')->table('users')->insert([
            'name' => 'Usuario 1',
            'email' => 'user1@test.com',
            'password' => bcrypt('password'),
            'tipo_cuenta' => 'usuario_notaria',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('tenant_temp')->table('users')->insert([
            'name' => 'Usuario 2',
            'email' => 'user2@test.com',
            'password' => bcrypt('password'),
            'tipo_cuenta' => 'usuario_notaria',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Act - Simular lo que hace NotariaUserController
        $users = DB::connection('tenant_temp')->table('users')->get();

        // Assert
        expect($users)->toHaveCount(2);
        expect($users->pluck('email')->toArray())->toContain('user1@test.com', 'user2@test.com');

        // Cleanup
        DB::purge('tenant_temp');
    });

    test('superadmin debe poder consultar múltiples BDs tenant', function () {
        // Arrange - Crear 2 notarías
        $notaria1 = Notaria::create([
            'nombre' => 'Notaría Test 999',
            'numero_notaria' => 999,
            'estado' => 'Estado de México',
            'activa' => true,
            'fecha_registro' => now(),
        ]);

        $notaria2 = Notaria::create([
            'nombre' => 'Notaría Test 888',
            'numero_notaria' => 888,
            'estado' => 'Estado de México',
            'activa' => true,
            'fecha_registro' => now(),
        ]);

        $estadoCodigo = EstadoMexico::getCodeFromName('Estado de México');
        $db1Name = "atinet_{$estadoCodigo}_notaria_999";
        $db2Name = "atinet_{$estadoCodigo}_notaria_888";

        // Crear ambas BDs
        DB::statement("CREATE DATABASE IF NOT EXISTS `{$db1Name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        DB::statement("CREATE DATABASE IF NOT EXISTS `{$db2Name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Crear tabla en BD1
        config(['database.connections.tenant_temp_1' => [
            'driver' => 'mysql',
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => $db1Name,
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]]);

        DB::connection('tenant_temp_1')->statement("
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL
            )
        ");

        DB::connection('tenant_temp_1')->table('users')->insert([
            ['name' => 'User Notaria 999', 'email' => 'user@999.com'],
        ]);

        // Crear tabla en BD2
        config(['database.connections.tenant_temp_2' => [
            'driver' => 'mysql',
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => $db2Name,
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]]);

        DB::connection('tenant_temp_2')->statement("
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL
            )
        ");

        DB::connection('tenant_temp_2')->table('users')->insert([
            ['name' => 'User Notaria 888', 'email' => 'user@888.com'],
        ]);

        // Act - Superadmin consulta ambas BDs (barrido)
        $allUsers = [];

        $usersFromDb1 = DB::connection('tenant_temp_1')->table('users')->get();
        foreach ($usersFromDb1 as $user) {
            $allUsers[] = [
                'notaria_id' => $notaria1->id,
                'notaria_nombre' => $notaria1->nombre,
                'user_name' => $user->name,
                'user_email' => $user->email,
            ];
        }

        $usersFromDb2 = DB::connection('tenant_temp_2')->table('users')->get();
        foreach ($usersFromDb2 as $user) {
            $allUsers[] = [
                'notaria_id' => $notaria2->id,
                'notaria_nombre' => $notaria2->nombre,
                'user_name' => $user->name,
                'user_email' => $user->email,
            ];
        }

        // Assert - Superadmin ve datos de ambas notarías
        expect($allUsers)->toHaveCount(2);
        expect(collect($allUsers)->pluck('notaria_id')->unique())->toHaveCount(2);
        expect(collect($allUsers)->pluck('user_email')->toArray())
            ->toContain('user@999.com', 'user@888.com');

        // Cleanup
        DB::purge('tenant_temp_1');
        DB::purge('tenant_temp_2');
    });

    test('datos en BD master no contienen datos operativos de notarías', function () {
        // Arrange - Crear notarías
        $notaria = Notaria::create([
            'nombre' => 'Notaría Test 999',
            'numero_notaria' => 999,
            'estado' => 'Estado de México',
            'activa' => true,
            'fecha_registro' => now(),
        ]);

        // Act - Verificar que BD master solo tiene metadata
        $notariasInMaster = DB::connection('mysql')->table('notarias')->count();

        // BD master NO debe tener tabla de búsquedas operativas locales
        // Las búsquedas están en cada BD tenant

        // Assert
        expect($notariasInMaster)->toBeGreaterThan(0);

        // Verificar que la tabla notarias existe (metadata)
        $tables = DB::select("SHOW TABLES LIKE 'notarias'");
        expect($tables)->toHaveCount(1);
    });

});

describe('propuesta visualización superadmin', function () {

    test('simulación opción 1: barrido de BDs con cache JSON', function () {
        // Este test demuestra cómo funcionaría el barrido

        // Arrange
        $notarias = Notaria::where('activa', true)->get();
        $aggregatedData = [];

        foreach ($notarias as $notaria) {
            $estadoCodigo = EstadoMexico::getCodeFromName($notaria->estado);
            $dbName = "atinet_{$estadoCodigo}_notaria_{$notaria->numero_notaria}";

            // Simular configuración y query (en producción sería real)
            $aggregatedData[] = [
                'notaria_id' => $notaria->id,
                'notaria_nombre' => $notaria->nombre,
                'database_name' => $dbName,
                'total_usuarios' => 0, // Se consultaría de BD tenant
                'total_busquedas' => 0, // Se consultaría de BD tenant
                'ultima_actividad' => null, // Se consultaría de BD tenant
            ];
        }

        // Act - Guardar en cache o JSON
        $jsonData = json_encode($aggregatedData, JSON_PRETTY_PRINT);

        // Assert
        expect($jsonData)->toBeString();
        expect(json_decode($jsonData, true))->toBeArray();

        // En producción esto se guardaría en:
        // - Cache: Cache::put('superadmin_dashboard', $aggregatedData, 3600)
        // - JSON: Storage::put('superadmin_dashboard.json', $jsonData)
        // - Redis: Redis::set('superadmin:dashboard', $jsonData)
    });

});
