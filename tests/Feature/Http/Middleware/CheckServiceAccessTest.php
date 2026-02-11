<?php

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\Models\Subscription;
use App\Models\User;
use App\ServiceCategory;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    // Crear una ruta de prueba protegida por el middleware
    Route::middleware(['web', 'service:sat-consulta'])->get('/test-service', function () {
        return response()->json([
            'message' => 'Acceso permitido',
            'service_code' => request()->attributes->get('service_code'),
            'service_stats' => request()->attributes->get('service_stats'),
        ]);
    });
});

test('bloquea acceso cuando el usuario no está autenticado', function () {
    $response = $this->get('/test-service');

    $response->assertRedirect(route('login'));
    $response->assertSessionHas('error');
});

test('bloquea acceso cuando el usuario no está autenticado (JSON)', function () {
    $response = $this->getJson('/test-service');

    $response->assertStatus(401);
    $response->assertJson([
        'message' => 'No autenticado. Por favor inicia sesión.',
    ]);
});

test('bloquea acceso cuando el usuario no tiene notaría asociada', function () {
    $user = User::factory()->create(['notaria_id' => null]);

    $response = $this->actingAs($user)->get('/test-service');

    $response->assertStatus(403);
});

test('bloquea acceso cuando el usuario no tiene notaría asociada (JSON)', function () {
    $user = User::factory()->create(['notaria_id' => null]);

    $response = $this->actingAs($user)->getJson('/test-service');

    $response->assertStatus(403);
    $response->assertJson([
        'message' => 'Tu usuario no está asociado a ninguna notaría.',
    ]);
});

test('bloquea acceso cuando la notaría no tiene acceso al servicio', function () {
    $notaria = Notaria::factory()->create(['activa' => true]);
    $user = User::factory()->create(['notaria_id' => $notaria->id]);

    // Crear servicio pero sin plan activo
    Service::factory()->create([
        'code' => 'sat-consulta',
        'category' => ServiceCategory::CONSULTA,
    ]);

    $response = $this->actingAs($user)->get('/test-service');

    $response->assertStatus(403);
});

test('bloquea acceso cuando la notaría no tiene acceso al servicio (JSON)', function () {
    $notaria = Notaria::factory()->create(['activa' => true]);
    $user = User::factory()->create(['notaria_id' => $notaria->id]);

    Service::factory()->create([
        'code' => 'sat-consulta',
        'category' => ServiceCategory::CONSULTA,
    ]);

    $response = $this->actingAs($user)->getJson('/test-service');

    $response->assertStatus(403);
    $response->assertJson([
        'message' => 'No tienes acceso a este servicio.',
        'service' => 'sat-consulta',
    ]);
});

test('bloquea acceso cuando se ha alcanzado el límite de uso', function () {
    $notaria = Notaria::factory()->create(['activa' => true]);
    $user = User::factory()->create(['notaria_id' => $notaria->id]);

    $service = Service::factory()->create([
        'code' => 'sat-consulta',
        'category' => ServiceCategory::CONSULTA,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, ['usage_limit' => 10]);

    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    // Crear 10 usos (alcanzar el límite)
    ServiceUsage::factory()->count(10)->create([
        'notaria_id' => $notaria->id,
        'service_id' => $service->id,
        'consumed_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/test-service');

    $response->assertStatus(429);
});

test('bloquea acceso cuando se ha alcanzado el límite de uso (JSON)', function () {
    $notaria = Notaria::factory()->create(['activa' => true]);
    $user = User::factory()->create(['notaria_id' => $notaria->id]);

    $service = Service::factory()->create([
        'code' => 'sat-consulta',
        'category' => ServiceCategory::CONSULTA,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, ['usage_limit' => 10]);

    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    ServiceUsage::factory()->count(10)->create([
        'notaria_id' => $notaria->id,
        'service_id' => $service->id,
        'consumed_at' => now(),
    ]);

    $response = $this->actingAs($user)->getJson('/test-service');

    $response->assertStatus(429);
    $response->assertJson([
        'message' => 'Has alcanzado el límite de uso de este servicio.',
        'service' => 'sat-consulta',
        'limit' => 10,
        'used' => 10,
        'remaining' => 0,
    ]);
});

test('permite acceso cuando el usuario tiene una suscripción válida', function () {
    $notaria = Notaria::factory()->create(['activa' => true]);
    $user = User::factory()->create(['notaria_id' => $notaria->id]);

    $service = Service::factory()->create([
        'code' => 'sat-consulta',
        'category' => ServiceCategory::CONSULTA,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, ['usage_limit' => 10]);

    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    $response = $this->actingAs($user)->get('/test-service');

    $response->assertStatus(200);
    $response->assertJson([
        'message' => 'Acceso permitido',
        'service_code' => 'sat-consulta',
    ]);
});

test('agrega atributos del servicio al request cuando el acceso es permitido', function () {
    $notaria = Notaria::factory()->create(['activa' => true]);
    $user = User::factory()->create(['notaria_id' => $notaria->id]);

    $service = Service::factory()->create([
        'code' => 'sat-consulta',
        'category' => ServiceCategory::CONSULTA,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, ['usage_limit' => 10]);

    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    ServiceUsage::factory()->count(3)->create([
        'notaria_id' => $notaria->id,
        'service_id' => $service->id,
        'consumed_at' => now(),
    ]);

    $response = $this->actingAs($user)->getJson('/test-service');

    $response->assertStatus(200);

    $data = $response->json();
    expect($data['service_code'])->toBe('sat-consulta');
    expect($data['service_stats'])->toHaveKeys(['limit', 'used', 'remaining']);
    expect($data['service_stats']['limit'])->toBe(10);
    expect($data['service_stats']['used'])->toBe(3);
    expect($data['service_stats']['remaining'])->toBe(7);
});

test('permite acceso con servicio personalizado que tiene mayor límite que el plan', function () {
    $notaria = Notaria::factory()->create(['activa' => true]);
    $user = User::factory()->create(['notaria_id' => $notaria->id]);

    $service = Service::factory()->create([
        'code' => 'sat-consulta',
        'category' => ServiceCategory::CONSULTA,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, ['usage_limit' => 10]);

    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    // Servicio personalizado con límite mayor
    $notaria->services()->attach($service->id, ['custom_limit' => 50]);

    // Crear 40 usos (excedería el límite del plan pero no el personalizado)
    ServiceUsage::factory()->count(40)->create([
        'notaria_id' => $notaria->id,
        'service_id' => $service->id,
        'consumed_at' => now(),
    ]);

    $response = $this->actingAs($user)->getJson('/test-service');

    $response->assertStatus(200);
    expect($response->json('service_stats.limit'))->toBe(50);
    expect($response->json('service_stats.used'))->toBe(40);
});
