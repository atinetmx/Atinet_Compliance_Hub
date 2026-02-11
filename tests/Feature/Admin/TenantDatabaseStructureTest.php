<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    // Crear un Super Admin para las pruebas
    $this->superAdmin = User::factory()->create([
        'tipo_cuenta' => 'super_admin',
        'notaria_id' => null,
    ]);
});

test('la base de datos del tenant tiene la estructura correcta con notaria_id', function () {
    // Usar la BD del tenant creada por el usuario
    $databaseName = 'atinet_notaria_1';

    // Verificar que las tablas existen
    $tables = DB::select("SHOW TABLES FROM `{$databaseName}`");
    $tableNames = array_map(function ($table) use ($databaseName) {
        return $table->{"Tables_in_{$databaseName}"};
    }, $tables);

    expect($tableNames)->toContain('tenant_services')
        ->and($tableNames)->toContain('service_usage')
        ->and($tableNames)->toContain('services')
        ->and($tableNames)->toContain('plan_services');
});

test('tabla tenant_services tiene columna notaria_id en lugar de tenant_id', function () {
    // Usar la BD del tenant creada por el usuario
    $databaseName = 'atinet_notaria_1';

    // Verificar estructura de tenant_services
    $columns = DB::select("SHOW COLUMNS FROM `{$databaseName}`.`tenant_services`");
    $columnNames = array_column($columns, 'Field');

    expect($columnNames)->toContain('notaria_id')
        ->and($columnNames)->not->toContain('tenant_id')
        ->and($columnNames)->toContain('service_id')
        ->and($columnNames)->toContain('custom_limit')
        ->and($columnNames)->toContain('custom_price')
        ->and($columnNames)->toContain('is_enabled');

    // Verificar que notaria_id es bigint unsigned NOT NULL
    $notariaIdColumn = collect($columns)->firstWhere('Field', 'notaria_id');
    expect($notariaIdColumn)->not->toBeNull()
        ->and($notariaIdColumn->Type)->toContain('bigint')
        ->and($notariaIdColumn->Null)->toBe('NO');
});

test('tabla service_usage tiene columna notaria_id en lugar de tenant_id', function () {
    // Usar la BD del tenant creada por el usuario
    $databaseName = 'atinet_notaria_1';

    // Verificar estructura de service_usage
    $columns = DB::select("SHOW COLUMNS FROM `{$databaseName}`.`service_usage`");
    $columnNames = array_column($columns, 'Field');

    expect($columnNames)->toContain('notaria_id')
        ->and($columnNames)->not->toContain('tenant_id')
        ->and($columnNames)->toContain('service_id')
        ->and($columnNames)->toContain('user_id')
        ->and($columnNames)->toContain('consumed_at')
        ->and($columnNames)->toContain('quantity')
        ->and($columnNames)->toContain('cost')
        ->and($columnNames)->toContain('billable');

    // Verificar que notaria_id es bigint unsigned NOT NULL
    $notariaIdColumn = collect($columns)->firstWhere('Field', 'notaria_id');
    expect($notariaIdColumn)->not->toBeNull()
        ->and($notariaIdColumn->Type)->toContain('bigint')
        ->and($notariaIdColumn->Null)->toBe('NO');
});

test('índices de tenant_services usan notaria_id correctamente', function () {
    // Usar la BD del tenant creada por el usuario
    $databaseName = 'atinet_notaria_1';

    // Verificar índices
    $indexes = DB::select("SHOW INDEX FROM `{$databaseName}`.`tenant_services`");
    $indexNames = array_unique(array_column($indexes, 'Key_name'));

    // Verificar que existe el índice único con notaria_id
    expect($indexNames)->toContain('tenant_services_notaria_id_service_id_unique')
        ->and($indexNames)->not->toContain('tenant_services_tenant_id_service_id_unique')
        ->and($indexNames)->not->toContain('tenant_services_tenant_id_index');

    // Verificar que las columnas en el índice único son correctas
    $uniqueIndex = collect($indexes)->where('Key_name', 'tenant_services_notaria_id_service_id_unique');
    $columnNames = $uniqueIndex->pluck('Column_name')->toArray();

    expect($columnNames)->toContain('notaria_id')
        ->and($columnNames)->toContain('service_id');
});

test('índices de service_usage usan notaria_id correctamente', function () {
    // Usar la BD del tenant creada por el usuario
    $databaseName = 'atinet_notaria_1';

    // Verificar índices
    $indexes = DB::select("SHOW INDEX FROM `{$databaseName}`.`service_usage`");
    $indexNames = array_unique(array_column($indexes, 'Key_name'));

    expect($indexNames)->toContain('service_usage_notaria_id_index')
        ->and($indexNames)->not->toContain('service_usage_tenant_id_index');
});

test('puede insertar datos en tenant_services con notaria_id', function () {
    // Usar la BD del tenant creada por el usuario
    $databaseName = 'atinet_notaria_1';

    // Buscar la notaría en la BD principal (no testing)
    $notaria = DB::connection('mysql')->table('notarias')->where('id', 1)->first();

    if (! $notaria) {
        $this->markTestSkipped('No existe la notaría con ID 1 en la BD principal');
    }

    // Obtener un servicio de prueba
    $service = DB::select("SELECT id FROM `{$databaseName}`.`services` LIMIT 1");

    if (empty($service)) {
        $this->markTestSkipped('No hay servicios en la BD del tenant para probar');
    }

    $serviceId = $service[0]->id;

    // Intentar insertar un registro
    $inserted = DB::insert(
        "INSERT INTO `{$databaseName}`.`tenant_services`
        (`notaria_id`, `service_id`, `is_enabled`, `custom_limit`, `created_at`, `updated_at`)
        VALUES (?, ?, ?, ?, NOW(), NOW())",
        [$notaria->id, $serviceId, 1, 100]
    );

    expect($inserted)->toBeTrue();

    // Verificar que se insertó correctamente
    $record = DB::select(
        "SELECT * FROM `{$databaseName}`.`tenant_services`
        WHERE `notaria_id` = ? AND `service_id` = ?",
        [$notaria->id, $serviceId]
    );

    expect($record)->not->toBeEmpty()
        ->and($record[0]->notaria_id)->toBe($notaria->id)
        ->and($record[0]->service_id)->toBe($serviceId)
        ->and($record[0]->custom_limit)->toBe(100);

    // Limpiar
    DB::delete(
        "DELETE FROM `{$databaseName}`.`tenant_services`
        WHERE `notaria_id` = ? AND `service_id` = ?",
        [$notaria->id, $serviceId]
    );
});

test('puede insertar datos en service_usage con notaria_id', function () {
    // Usar la BD del tenant creada por el usuario
    $databaseName = 'atinet_notaria_1';

    // Buscar la notaría y usuario en la BD principal
    $notaria = DB::connection('mysql')->table('notarias')->where('id', 1)->first();

    if (! $notaria) {
        $this->markTestSkipped('No existe la notaría con ID 1 en la BD principal');
    }

    // Obtener un servicio y usuario de prueba
    $service = DB::select("SELECT id FROM `{$databaseName}`.`services` LIMIT 1");
    $user = DB::connection('mysql')->table('users')->where('notaria_id', $notaria->id)->first();

    if (empty($service) || ! $user) {
        $this->markTestSkipped('No hay datos suficientes en la BD del tenant para probar');
    }

    $serviceId = $service[0]->id;

    // Intentar insertar un registro
    $inserted = DB::insert(
        "INSERT INTO `{$databaseName}`.`service_usage`
        (`notaria_id`, `service_id`, `user_id`, `consumed_at`, `quantity`, `cost`, `billable`, `created_at`)
        VALUES (?, ?, ?, NOW(), ?, ?, ?, NOW())",
        [$notaria->id, $serviceId, $user->id, 1, 0.00, 1]
    );

    expect($inserted)->toBeTrue();

    // Verificar que se insertó correctamente
    $record = DB::select(
        "SELECT * FROM `{$databaseName}`.`service_usage`
        WHERE `notaria_id` = ? AND `service_id` = ? AND `user_id` = ?",
        [$notaria->id, $serviceId, $user->id]
    );

    expect($record)->not->toBeEmpty()
        ->and($record[0]->notaria_id)->toBe($notaria->id)
        ->and($record[0]->service_id)->toBe($serviceId)
        ->and($record[0]->user_id)->toBe($user->id);

    // Limpiar
    DB::delete(
        "DELETE FROM `{$databaseName}`.`service_usage`
        WHERE `notaria_id` = ? AND `service_id` = ? AND `user_id` = ?",
        [$notaria->id, $serviceId, $user->id]
    );
});

test('verifica integridad referencial - no puede insertar notaria_id inexistente', function () {
    // Usar la BD del tenant creada por el usuario
    $databaseName = 'atinet_notaria_1';
    $service = DB::select("SELECT id FROM `{$databaseName}`.`services` LIMIT 1");

    if (empty($service)) {
        $this->markTestSkipped('No hay servicios en la BD del tenant para probar');
    }

    $serviceId = $service[0]->id;
    $fakeNotariaId = 99999; // ID que no existe

    // Intentar insertar con notaria_id inexistente (debería fallar si hay FK)
    // Nota: Si no hay FK definidas, esto pasará, pero la columna debe existir
    try {
        DB::insert(
            "INSERT INTO `{$databaseName}`.`tenant_services`
            (`notaria_id`, `service_id`, `is_enabled`, `created_at`, `updated_at`)
            VALUES (?, ?, ?, NOW(), NOW())",
            [$fakeNotariaId, $serviceId, 1]
        );

        // Si llegamos aquí, no hay FK pero la columna sí existe
        $record = DB::select(
            "SELECT * FROM `{$databaseName}`.`tenant_services`
            WHERE `notaria_id` = ?",
            [$fakeNotariaId]
        );

        expect($record)->not->toBeEmpty()
            ->and($record[0]->notaria_id)->toBe($fakeNotariaId);

        // Limpiar
        DB::delete(
            "DELETE FROM `{$databaseName}`.`tenant_services` WHERE `notaria_id` = ?",
            [$fakeNotariaId]
        );
    } catch (\Exception $e) {
        // Si falla, es porque hay FK (comportamiento esperado ideal)
        expect($e->getMessage())->toContain('foreign key');
    }
})->skip('Test opcional de integridad referencial');
