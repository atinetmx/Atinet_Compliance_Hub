<?php

use App\Models\Busqueda;
use App\Models\Notaria;
use App\Models\Subscription;
use App\Models\User;

beforeEach(function () {
    $this->notaria = Notaria::factory()->create();

    // Crear suscripción activa para la notaría
    Subscription::factory()->create([
        'notaria_id' => $this->notaria->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    $this->user = User::factory()->create([
        'notaria_id' => $this->notaria->id,
        'tipo_cuenta' => 'admin_notaria',
    ]);

    $this->actingAs($this->user);
});

test('puede listar búsquedas del usuario autenticado', function () {
    Busqueda::factory()->count(3)->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->getJson('/admin/search-history');

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
        ]);

    // Laravel paginator retorna data dentro de data
    expect($response->json('data.data'))->toHaveCount(3);
});

test('puede filtrar búsquedas por tipo', function () {
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'tipo_busqueda' => 'Persona Física',
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'tipo_busqueda' => 'RFC',
    ]);

    $response = $this->getJson('/admin/search-history?tipo_busqueda=RFC');

    $response->assertSuccessful();
    $data = $response->json('data.data');

    expect($data)->toHaveCount(1)
        ->and($data[0]['tipo_busqueda'])->toBe('RFC');
});

test('puede filtrar búsquedas por término', function () {
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'termino_busqueda' => 'Juan Pérez',
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'termino_busqueda' => 'María González',
    ]);

    $response = $this->getJson('/admin/search-history?termino=Juan');

    $response->assertSuccessful();
    $data = $response->json('data.data');

    expect($data)->toHaveCount(1);
});

test('puede filtrar búsquedas por días', function () {
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'created_at' => now()->subDays(40),
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'created_at' => now()->subDays(5),
    ]);

    $response = $this->getJson('/admin/search-history?dias=30');

    $response->assertSuccessful();
    $data = $response->json('data.data');

    expect($data)->toHaveCount(1);
});

test('super admin puede filtrar búsquedas por notaría', function () {
    $otraNotaria = Notaria::factory()->create();

    Subscription::factory()->create([
        'notaria_id' => $otraNotaria->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    $superAdmin = User::factory()->create([
        'tipo_cuenta' => 'super_admin',
    ]);

    $this->actingAs($superAdmin);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'termino_busqueda' => 'Búsqueda notaría 1',
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $otraNotaria->id,
        'user_id' => $this->user->id,
        'termino_busqueda' => 'Búsqueda notaría 2',
    ]);

    $response = $this->getJson("/admin/search-history?notaria_id={$otraNotaria->id}");

    $response->assertSuccessful();

    $data = $response->json('data.data');
    $notariasDisponibles = collect($response->json('filters.notarias_disponibles'))->pluck('id');

    expect($data)->toHaveCount(1)
        ->and($data[0]['notaria_id'])->toBe($otraNotaria->id)
        ->and($notariasDisponibles)->toContain($this->notaria->id, $otraNotaria->id);
});

test('puede ver detalle de una búsqueda propia', function () {
    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'tipo_busqueda' => 'Persona Física',
        'termino_busqueda' => 'Juan Pérez',
    ]);

    $response = $this->getJson("/admin/search-history/{$busqueda->id}");

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $busqueda->id,
                'tipo_busqueda' => 'Persona Física',
                'termino_busqueda' => 'Juan Pérez',
            ],
        ]);
});

test('no puede ver búsqueda de otra notaría', function () {
    // Crear otra notaría con su suscripción
    $otraNotaria = Notaria::factory()->create();
    Subscription::factory()->create([
        'notaria_id' => $otraNotaria->id,
        'status' => Subscription::STATUS_ACTIVA,
    ]);

    $otroUsuario = User::factory()->create([
        'notaria_id' => $otraNotaria->id,
        'tipo_cuenta' => 'admin_notaria',
    ]);

    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $otraNotaria->id,
        'user_id' => $otroUsuario->id,
    ]);

    $response = $this->getJson("/admin/search-history/{$busqueda->id}");

    // El global scope filtra automáticamente por notaria_id, por lo que devuelve 404
    // Esto es correcto para seguridad multi-tenant: no revelar existencia de recursos de otros tenants
    $response->assertNotFound();
});

test('super admin puede ver búsqueda de cualquier usuario', function () {
    $superAdmin = User::factory()->create([
        'tipo_cuenta' => 'super_admin',
    ]);

    $this->actingAs($superAdmin);

    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->getJson("/admin/search-history/{$busqueda->id}");

    $response->assertSuccessful();
});

test('puede eliminar una búsqueda propia', function () {
    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->deleteJson("/admin/search-history/{$busqueda->id}");

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
        ]);

    expect(Busqueda::find($busqueda->id))->toBeNull();
});

test('no puede eliminar búsqueda de otro usuario', function () {
    $otroUsuario = User::factory()->create([
        'notaria_id' => $this->notaria->id,
    ]);

    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $otroUsuario->id,
    ]);

    $response = $this->deleteJson("/admin/search-history/{$busqueda->id}");

    $response->assertForbidden();
    expect(Busqueda::find($busqueda->id))->not->toBeNull();
});

test('puede obtener estadísticas de búsquedas', function () {
    // Búsquedas de este mes
    Busqueda::factory()->count(3)->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'created_at' => now(),
    ]);

    // Búsquedas de hace 2 meses
    Busqueda::factory()->count(2)->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'created_at' => now()->subMonths(2),
    ]);

    $response = $this->getJson('/admin/search-history/statistics');

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                'total_busquedas',
                'busquedas_este_mes',
                'busquedas_esta_semana',
                'busquedas_hoy',
            ],
        ]);

    expect($response->json('data.total_busquedas'))->toBe(5)
        ->and($response->json('data.busquedas_este_mes'))->toBe(3);
});

test('estadísticas incluyen promedio de resultados', function () {
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'resultados' => ['total' => 5],
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'resultados' => ['total' => 3],
    ]);

    $response = $this->getJson('/admin/search-history/statistics');

    $response->assertSuccessful();

    // JSON puede omitir .0 cuando el decimal es cero (4.0 se serializa como 4)
    $promedio = $response->json('data.promedio_resultados');
    expect($promedio)->toBeIn([4, 4.0])
        ->and($promedio == 4.0)->toBeTrue();
});

test('estadísticas incluyen tipo más usado', function () {
    Busqueda::factory()->count(5)->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'tipo_busqueda' => 'Persona Física',
    ]);

    Busqueda::factory()->count(2)->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'tipo_busqueda' => 'RFC',
    ]);

    $response = $this->getJson('/admin/search-history/statistics');

    $response->assertSuccessful();

    expect($response->json('data.tipo_mas_usado'))->toBe('Persona Física');
});

test('super admin puede limpiar historial de una notaría', function () {
    $superAdmin = User::factory()->create([
        'tipo_cuenta' => 'super_admin',
    ]);

    $this->actingAs($superAdmin);

    Busqueda::factory()->count(5)->create([
        'notaria_id' => $this->notaria->id,
    ]);

    $response = $this->postJson('/admin/search-history/clear-notaria', [
        'notaria_id' => $this->notaria->id,
    ]);

    $response->assertSuccessful();

    expect(Busqueda::where('notaria_id', $this->notaria->id)->count())->toBe(0);
});

test('usuario normal no puede limpiar historial de notaría', function () {
    Busqueda::factory()->count(5)->create([
        'notaria_id' => $this->notaria->id,
    ]);

    $response = $this->postJson('/admin/search-history/clear-notaria', [
        'notaria_id' => $this->notaria->id,
    ]);

    $response->assertForbidden();

    expect(Busqueda::where('notaria_id', $this->notaria->id)->count())->toBe(5);
});

test('listado incluye paginación', function () {
    Busqueda::factory()->count(20)->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->getJson('/admin/search-history');

    $response->assertSuccessful();

    // Debe retornar solo 15 por página (ver SearchHistoryController)
    expect($response->json('data.data'))->toHaveCount(15);
});

test('búsquedas están ordenadas por más recientes primero', function () {
    $busquedaVieja = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'created_at' => now()->subDays(10),
    ]);

    $busquedaNueva = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'created_at' => now(),
    ]);

    $response = $this->getJson('/admin/search-history');

    $response->assertSuccessful();
    $data = $response->json('data.data');

    expect($data[0]['id'])->toBe($busquedaNueva->id)
        ->and($data[1]['id'])->toBe($busquedaVieja->id);
});
