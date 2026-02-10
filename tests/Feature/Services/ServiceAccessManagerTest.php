<?php

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\Models\Subscription;
use App\Services\ServiceAccessManager;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    $this->manager = app(ServiceAccessManager::class);
});

test('notaria con suscripción activa puede acceder a servicio del plan', function () {
    // Crear servicio
    $service = Service::factory()->create([
        'code' => 'sat-consulta',
        'is_active' => true,
    ]);

    // Crear plan con servicio incluido
    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, [
        'is_included' => true,
        'usage_limit' => 100,
    ]);

    // Crear notaría con suscripción activa
    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    expect($this->manager->canAccess($notaria, 'sat-consulta'))->toBeTrue();
});

test('notaria sin suscripción no puede acceder a servicios', function () {
    $service = Service::factory()->create(['code' => 'sat-consulta']);
    $notaria = Notaria::factory()->create(['activa' => true]);

    expect($this->manager->canAccess($notaria, 'sat-consulta'))->toBeFalse();
});

test('notaria inactiva no puede acceder a servicios', function () {
    $service = Service::factory()->create(['code' => 'sat-consulta']);
    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, ['is_included' => true]);

    $notaria = Notaria::factory()->create(['activa' => false]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    expect($this->manager->canAccess($notaria, 'sat-consulta'))->toBeFalse();
});

test('notaria con suscripción vencida solo accede a consultas en período de gracia', function () {
    // Crear servicios de diferentes categorías
    $consultaService = Service::factory()->create([
        'code' => 'consulta-ofac',
        'category' => 'consulta',
        'is_active' => true,
    ]);

    $apiService = Service::factory()->create([
        'code' => 'api-sat',
        'category' => 'api',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach([$consultaService->id, $apiService->id], [
        'is_included' => true,
    ]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_VENCIDA,  // Vencida pero aún no suspendida
        'fecha_inicio' => now()->subMonth(),
        'fecha_vencimiento' => now()->addDays(3),  // Aún dentro del período
    ]);

    // Debe poder acceder a consultas
    expect($this->manager->canAccess($notaria, 'consulta-ofac'))->toBeTrue();

    // No debe poder acceder a APIs
    expect($this->manager->canAccess($notaria, 'api-sat'))->toBeFalse();
});

test('servicio personalizado tiene prioridad sobre plan', function () {
    $service = Service::factory()->create([
        'code' => 'api-custom',
        'is_active' => true,
    ]);

    // Plan SIN el servicio
    $plan = Plan::factory()->create();

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    // Agregar servicio personalizado a la notaría
    $notaria->services()->attach($service->id, [
        'is_enabled' => true,
        'custom_limit' => 50,
        'expiration_date' => null,
    ]);

    // Debe tener acceso por configuración personalizada
    expect($this->manager->canAccess($notaria, 'api-custom'))->toBeTrue();
});

test('hasReachedLimit detecta cuando se alcanza el límite', function () {
    $service = Service::factory()->create([
        'code' => 'sat-consulta',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, [
        'is_included' => true,
        'usage_limit' => 10,  // Límite de 10 usos
    ]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    // Crear 10 usos en el mes actual
    ServiceUsage::factory()->count(10)->create([
        'tenant_id' => $notaria->id,
        'service_id' => $service->id,
        'quantity' => 1,
        'consumed_at' => now(),
    ]);

    expect($this->manager->hasReachedLimit($notaria, 'sat-consulta'))->toBeTrue();
});

test('getRemainingUsage calcula correctamente el uso restante', function () {
    $service = Service::factory()->create([
        'code' => 'sat-consulta',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, [
        'is_included' => true,
        'usage_limit' => 100,
    ]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    // Crear 30 usos
    ServiceUsage::factory()->count(30)->create([
        'tenant_id' => $notaria->id,
        'service_id' => $service->id,
        'quantity' => 1,
        'consumed_at' => now(),
    ]);

    $remaining = $this->manager->getRemainingUsage($notaria, 'sat-consulta');

    expect($remaining)->toBe(70);  // 100 - 30 = 70
});

test('getRemainingUsage retorna null para servicios ilimitados', function () {
    $service = Service::factory()->create([
        'code' => 'consulta-ilimitada',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, [
        'is_included' => true,
        'usage_limit' => null,  // Sin límite
    ]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    expect($this->manager->getRemainingUsage($notaria, 'consulta-ilimitada'))->toBeNull();
});

test('getUsageStats retorna estadísticas completas', function () {
    $service = Service::factory()->create([
        'code' => 'sat-validacion',
        'name' => 'Validación SAT',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, [
        'is_included' => true,
        'usage_limit' => 50,
    ]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    // Crear 20 usos
    ServiceUsage::factory()->count(20)->create([
        'tenant_id' => $notaria->id,
        'service_id' => $service->id,
        'quantity' => 1,
        'cost' => 5.00,
        'consumed_at' => now(),
    ]);

    $stats = $this->manager->getUsageStats($notaria, 'sat-validacion');

    expect($stats)
        ->toHaveKey('service_code')
        ->toHaveKey('service_name')
        ->toHaveKey('has_access')
        ->toHaveKey('limit')
        ->toHaveKey('used')
        ->toHaveKey('remaining')
        ->toHaveKey('usage_percentage')
        ->and($stats['service_code'])->toBe('sat-validacion')
        ->and($stats['service_name'])->toBe('Validación SAT')
        ->and($stats['has_access'])->toBeTrue()
        ->and($stats['limit'])->toBe(50)
        ->and($stats['used'])->toBe(20)
        ->and($stats['remaining'])->toBe(30)
        ->and($stats['usage_percentage'])->toBe(40.0)
        ->and($stats['total_cost'])->toBe(100.0);
});

test('getAvailableServices retorna todos los servicios del plan con estadísticas', function () {
    $service1 = Service::factory()->create(['code' => 'service-1', 'is_active' => true]);
    $service2 = Service::factory()->create(['code' => 'service-2', 'is_active' => true]);

    $plan = Plan::factory()->create();
    $plan->services()->attach([
        $service1->id => ['is_included' => true, 'usage_limit' => 100],
        $service2->id => ['is_included' => true, 'usage_limit' => 200],
    ]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    $services = $this->manager->getAvailableServices($notaria);

    expect($services)
        ->toBeArray()
        ->toHaveCount(2)
        ->and($services[0])->toHaveKey('service_code')
        ->and($services[1])->toHaveKey('service_code');
});

test('clearCache limpia el caché de acceso', function () {
    $service = Service::factory()->create([
        'code' => 'test-service',
        'is_active' => true,
    ]);

    $notaria = Notaria::factory()->create();

    // Forzar creación de caché
    $cacheKey = "service_access:{$notaria->id}:test-service";
    Cache::put($cacheKey, true, 300);

    expect(Cache::has($cacheKey))->toBeTrue();

    $this->manager->clearCache($notaria);

    expect(Cache::has($cacheKey))->toBeFalse();
});

test('límite personalizado tiene prioridad sobre límite del plan', function () {
    $service = Service::factory()->create([
        'code' => 'custom-limit-service',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, [
        'is_included' => true,
        'usage_limit' => 100,  // Límite del plan
    ]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    // Agregar límite personalizado
    $notaria->services()->attach($service->id, [
        'is_enabled' => true,
        'custom_limit' => 200,  // Límite personalizado más alto
    ]);

    // Crear 150 usos (excede plan pero no personalizado)
    ServiceUsage::factory()->count(150)->create([
        'tenant_id' => $notaria->id,
        'service_id' => $service->id,
        'quantity' => 1,
        'consumed_at' => now(),
    ]);

    // No debe haber alcanzado el límite (usa personalizado: 200)
    expect($this->manager->hasReachedLimit($notaria, 'custom-limit-service'))->toBeFalse();
    expect($this->manager->getRemainingUsage($notaria, 'custom-limit-service'))->toBe(50);
});

test('uso de meses anteriores no cuenta para el límite actual', function () {
    $service = Service::factory()->create([
        'code' => 'monthly-reset',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, [
        'is_included' => true,
        'usage_limit' => 50,
    ]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    // Crear 40 usos del mes pasado
    ServiceUsage::factory()->count(40)->create([
        'tenant_id' => $notaria->id,
        'service_id' => $service->id,
        'quantity' => 1,
        'consumed_at' => now()->subMonth(),
    ]);

    // Crear 10 usos del mes actual
    ServiceUsage::factory()->count(10)->create([
        'tenant_id' => $notaria->id,
        'service_id' => $service->id,
        'quantity' => 1,
        'consumed_at' => now(),
    ]);

    // Solo cuenta los del mes actual (10)
    expect($this->manager->getRemainingUsage($notaria, 'monthly-reset'))->toBe(40);
});

test('servicio trial puede acceder a servicios del plan', function () {
    $service = Service::factory()->create([
        'code' => 'trial-service',
        'is_active' => true,
    ]);

    $plan = Plan::factory()->create();
    $plan->services()->attach($service->id, ['is_included' => true]);

    $notaria = Notaria::factory()->create(['activa' => true]);
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_TRIAL,  // Trial
        'fecha_vencimiento' => now()->addDays(14),
    ]);

    expect($this->manager->canAccess($notaria, 'trial-service'))->toBeTrue();
});
