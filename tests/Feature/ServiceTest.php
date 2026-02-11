<?php

use App\BillingModel;
use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\ServiceCategory;

test('se puede crear un servicio con todos los campos requeridos', function () {
    $service = Service::create([
        'code' => 'TEST_SERVICE',
        'name' => 'Servicio de Prueba',
        'description' => 'Este es un servicio de prueba',
        'category' => ServiceCategory::CONSULTA,
        'billing_model' => BillingModel::LIMITED,
        'unit_price' => 10.00,
        'is_active' => true,
    ]);

    expect($service->code)->toBe('TEST_SERVICE')
        ->and($service->category)->toBe(ServiceCategory::CONSULTA)
        ->and($service->billing_model)->toBe(BillingModel::LIMITED)
        ->and($service->unit_price)->toEqual(10.00)
        ->and($service->is_active)->toBeTrue();
});

test('código de servicio debe ser único', function () {
    Service::factory()->create(['code' => 'UNIQUE_CODE']);

    expect(fn () => Service::factory()->create(['code' => 'UNIQUE_CODE']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

test('servicio puede ser incluido sin precio', function () {
    $service = Service::factory()->included()->create();

    expect($service->billing_model)->toBe(BillingModel::INCLUDED)
        ->and($service->unit_price)->toBeNull();
});

test('servicio tiene relación con planes', function () {
    $service = Service::factory()->create();
    $plan = Plan::factory()->create();

    $plan->services()->attach($service->id, [
        'is_included' => true,
        'usage_limit' => 100,
        'priority' => 1,
    ]);

    expect($service->plans()->count())->toBe(1)
        ->and($service->plans->first()->id)->toBe($plan->id)
        ->and($service->plans->first()->pivot->usage_limit)->toBe(100);
});

test('servicio tiene relación con notarías', function () {
    $service = Service::factory()->create();
    $notaria = Notaria::factory()->create();

    $notaria->services()->attach($service->id, [
        'is_enabled' => true,
        'custom_limit' => 50,
        'custom_price' => 5.00,
    ]);

    expect($service->notarias()->count())->toBe(1)
        ->and($service->notarias->first()->id)->toBe($notaria->id)
        ->and($service->notarias->first()->pivot->custom_limit)->toBe(50);
});

test('servicio tiene relación con registros de uso', function () {
    $service = Service::factory()->create();
    $notaria = Notaria::factory()->create();
    $user = \App\Models\User::factory()->create(['notaria_id' => $notaria->id]);

    $usage = ServiceUsage::create([
        'notaria_id' => $notaria->id,
        'service_id' => $service->id,
        'user_id' => $user->id,
        'consumed_at' => now(),
        'quantity' => 1,
        'cost' => 5.00,
        'billable' => true,
    ]);

    expect($service->usage()->count())->toBe(1)
        ->and($service->usage->first()->quantity)->toBe(1)
        ->and($service->usage->first()->cost)->toEqual(5.00);
});

test('servicio puede estar activo o inactivo', function () {
    $activeService = Service::factory()->create(['is_active' => true]);
    $inactiveService = Service::factory()->inactive()->create();

    expect($activeService->is_active)->toBeTrue()
        ->and($inactiveService->is_active)->toBeFalse();
});

test('servicio puede tener metadata en formato JSON', function () {
    $service = Service::factory()->create([
        'metadata' => ['feature_flags' => ['beta' => true], 'max_file_size' => '10MB'],
    ]);

    expect($service->metadata)->toBeArray()
        ->and($service->metadata['feature_flags']['beta'])->toBeTrue()
        ->and($service->metadata['max_file_size'])->toBe('10MB');
});

test('al eliminar un servicio se eliminan sus registros en plan_services', function () {
    $service = Service::factory()->create();
    $plan = Plan::factory()->create();

    $plan->services()->attach($service->id, ['is_included' => true, 'priority' => 1]);

    expect($plan->services()->count())->toBe(1);

    $service->delete();

    expect($plan->fresh()->services()->count())->toBe(0);
});

test('enums se castean correctamente desde base de datos', function () {
    $service = Service::factory()->create([
        'category' => ServiceCategory::API,
        'billing_model' => BillingModel::PER_USE,
    ]);

    $retrieved = Service::find($service->id);

    expect($retrieved->category)->toBeInstanceOf(ServiceCategory::class)
        ->and($retrieved->billing_model)->toBeInstanceOf(BillingModel::class)
        ->and($retrieved->category)->toBe(ServiceCategory::API)
        ->and($retrieved->billing_model)->toBe(BillingModel::PER_USE);
});

test('factory states funcionan correctamente', function () {
    $consultaService = Service::factory()->consulta()->create();
    $apiService = Service::factory()->api()->create();
    $sistemaService = Service::factory()->sistema()->create();

    expect($consultaService->category)->toBe(ServiceCategory::CONSULTA)
        ->and($apiService->category)->toBe(ServiceCategory::API)
        ->and($sistemaService->category)->toBe(ServiceCategory::SISTEMA)
        ->and($sistemaService->billing_model)->toBe(BillingModel::INCLUDED);
});

test('factory limited state configura servicio limitado', function () {
    $service = Service::factory()->limited()->create();

    expect($service->billing_model)->toBe(BillingModel::LIMITED);
});

test('factory unlimited state configura servicio ilimitado', function () {
    $service = Service::factory()->unlimited()->create();

    expect($service->billing_model)->toBe(BillingModel::UNLIMITED);
});

test('factory perUse state configura pago por uso', function () {
    $service = Service::factory()->perUse()->create();

    expect($service->billing_model)->toBe(BillingModel::PER_USE);
});
