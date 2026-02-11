<?php

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\Models\Subscription;
use App\Models\User;
use App\ServiceCategory;
use App\Services\ServiceUsageRecorder;

beforeEach(function () {
    $this->recorder = app(ServiceUsageRecorder::class);

    // Crear plan y servicios
    $this->plan = Plan::factory()->create();
    $this->service1 = Service::factory()->create([
        'code' => 'test-service-1',
        'name' => 'Test Service 1',
        'category' => ServiceCategory::CONSULTA,
        'unit_price' => 10.00,
    ]);

    $this->service2 = Service::factory()->create([
        'code' => 'test-service-2',
        'name' => 'Test Service 2',
        'category' => ServiceCategory::API,
        'unit_price' => 25.00,
    ]);

    $this->plan->services()->attach([
        $this->service1->id => ['usage_limit' => 100, 'is_included' => true],
        $this->service2->id => ['usage_limit' => 50, 'is_included' => true],
    ]);

    // Crear notaría y usuario
    $this->notaria = Notaria::factory()->create();
    $this->subscription = Subscription::factory()->create([
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => Subscription::STATUS_ACTIVA,
    ]);

    $this->user = User::factory()->create([
        'notaria_id' => $this->notaria->id,
        'tipo_cuenta' => 'admin_notaria',
    ]);
});

describe('ServiceUsageRecorder::record()', function () {
    test('registra el uso de un servicio con objeto Service', function () {
        $this->actingAs($this->user);

        $usage = $this->recorder->record(
            notaria: $this->notaria,
            service: $this->service1,
            quantity: 3,
            metadata: ['test' => 'data']
        );

        expect($usage)->not->toBeNull()
            ->and($usage->notaria_id)->toBe($this->notaria->id)
            ->and($usage->service_id)->toBe($this->service1->id)
            ->and($usage->user_id)->toBe($this->user->id)
            ->and($usage->quantity)->toBe(3)
            ->and($usage->cost)->toBe(30.0) // 10 * 3
            ->and($usage->billable)->toBeTrue()
            ->and($usage->metadata)->toBe(['test' => 'data']);
    });

    test('registra el uso de un servicio con código string', function () {
        $this->actingAs($this->user);

        $usage = $this->recorder->record(
            notaria: $this->notaria,
            service: 'test-service-1',
            quantity: 2
        );

        expect($usage)->not->toBeNull()
            ->and($usage->service_id)->toBe($this->service1->id)
            ->and($usage->quantity)->toBe(2);
    });

    test('devuelve null cuando el servicio no existe (string)', function () {
        $this->actingAs($this->user);

        $usage = $this->recorder->record(
            notaria: $this->notaria,
            service: 'servicio-inexistente'
        );

        expect($usage)->toBeNull();
    });

    test('devuelve null cuando no hay usuario autenticado', function () {
        $usage = $this->recorder->record(
            notaria: $this->notaria,
            service: $this->service1
        );

        expect($usage)->toBeNull();
    });

    test('permite especificar usuario explícitamente', function () {
        $otroUsuario = User::factory()->create([
            'notaria_id' => $this->notaria->id,
        ]);

        $usage = $this->recorder->record(
            notaria: $this->notaria,
            service: $this->service1,
            user: $otroUsuario
        );

        expect($usage)->not->toBeNull()
            ->and($usage->user_id)->toBe($otroUsuario->id);
    });

    test('permite especificar costo personalizado', function () {
        $this->actingAs($this->user);

        $usage = $this->recorder->record(
            notaria: $this->notaria,
            service: $this->service1,
            quantity: 1,
            cost: 99.99
        );

        expect($usage)->not->toBeNull()
            ->and($usage->cost)->toBe(99.99);
    });

    test('permite marcar como no facturable', function () {
        $this->actingAs($this->user);

        $usage = $this->recorder->record(
            notaria: $this->notaria,
            service: $this->service1,
            billable: false
        );

        expect($usage)->not->toBeNull()
            ->and($usage->billable)->toBeFalse();
    });

    test('usa precio personalizado del tenant si existe', function () {
        $this->actingAs($this->user);

        // Configurar precio personalizado
        $this->notaria->services()->attach($this->service1->id, [
            'custom_price' => 15.00,
            'is_enabled' => true,
        ]);

        $usage = $this->recorder->record(
            notaria: $this->notaria,
            service: $this->service1,
            quantity: 2
        );

        expect($usage)->not->toBeNull()
            ->and($usage->cost)->toBe(30.0); // 15 * 2
    });
});

describe('ServiceUsageRecorder::recordBatch()', function () {
    test('registra múltiples usos en batch', function () {
        $this->actingAs($this->user);

        $count = $this->recorder->recordBatch(
            notaria: $this->notaria,
            usages: [
                'test-service-1' => 3,
                'test-service-2' => 2,
            ]
        );

        expect($count)->toBe(2);

        $usages = ServiceUsage::where('notaria_id', $this->notaria->id)->get();
        expect($usages)->toHaveCount(2);
    });

    test('permite especificar metadata en batch', function () {
        $this->actingAs($this->user);

        $count = $this->recorder->recordBatch(
            notaria: $this->notaria,
            usages: [
                'test-service-1' => [
                    'quantity' => 5,
                    'metadata' => ['batch' => 'test'],
                    'billable' => false,
                ],
            ]
        );

        expect($count)->toBe(1);

        $usage = ServiceUsage::first();
        expect($usage->quantity)->toBe(5)
            ->and($usage->metadata)->toBe(['batch' => 'test'])
            ->and($usage->billable)->toBeFalse();
    });

    test('devuelve 0 cuando no hay servicios válidos', function () {
        $this->actingAs($this->user);

        $count = $this->recorder->recordBatch(
            notaria: $this->notaria,
            usages: [
                'servicio-inexistente-1' => 1,
                'servicio-inexistente-2' => 2,
            ]
        );

        expect($count)->toBe(0);
    });
});

describe('ServiceUsageRecorder::getCurrentMonthUsage()', function () {
    test('devuelve el uso del mes actual', function () {
        // Crear usos en el mes actual
        ServiceUsage::factory()->count(5)->create([
            'notaria_id' => $this->notaria->id,
            'service_id' => $this->service1->id,
            'consumed_at' => now(),
            'quantity' => 2,
        ]);

        // Crear usos en meses anteriores
        ServiceUsage::factory()->count(3)->create([
            'notaria_id' => $this->notaria->id,
            'service_id' => $this->service1->id,
            'consumed_at' => now()->subMonth(),
            'quantity' => 1,
        ]);

        $usage = $this->recorder->getCurrentMonthUsage($this->notaria, $this->service1);

        expect($usage)->toBe(10); // 5 * 2 = 10
    });

    test('acepta código de servicio como string', function () {
        ServiceUsage::factory()->count(3)->create([
            'notaria_id' => $this->notaria->id,
            'service_id' => $this->service1->id,
            'consumed_at' => now(),
            'quantity' => 1,
        ]);

        $usage = $this->recorder->getCurrentMonthUsage($this->notaria, 'test-service-1');

        expect($usage)->toBe(3);
    });
});

describe('ServiceUsageRecorder::getCurrentMonthCost()', function () {
    test('devuelve el costo del mes actual', function () {
        ServiceUsage::factory()->count(3)->create([
            'notaria_id' => $this->notaria->id,
            'service_id' => $this->service1->id,
            'consumed_at' => now(),
            'cost' => 10.50,
            'billable' => true,
        ]);

        // Crear un uso no facturable (no debecontarse)
        ServiceUsage::factory()->create([
            'notaria_id' => $this->notaria->id,
            'service_id' => $this->service1->id,
            'consumed_at' => now(),
            'cost' => 100.00,
            'billable' => false,
        ]);

        $cost = $this->recorder->getCurrentMonthCost($this->notaria, $this->service1);

        expect($cost)->toBe(31.5); // 3 * 10.50
    });
});

describe('ServiceUsageRecorder::markAsBilled()', function () {
    test('marca registros como facturados', function () {
        $usages = ServiceUsage::factory()->count(5)->create([
            'notaria_id' => $this->notaria->id,
            'service_id' => $this->service1->id,
            'billable' => true,
            'billed_at' => null,
        ]);

        $ids = $usages->pluck('id')->toArray();

        $count = $this->recorder->markAsBilled($ids);

        expect($count)->toBe(5);

        $billedUsages = ServiceUsage::whereIn('id', $ids)->get();
        expect($billedUsages->every(fn ($u) => $u->billed_at !== null))->toBeTrue();
    });

    test('no marca registros ya facturados', function () {
        $usages = ServiceUsage::factory()->count(3)->create([
            'notaria_id' => $this->notaria->id,
            'service_id' => $this->service1->id,
            'billed_at' => now()->subDay(),
        ]);

        $ids = $usages->pluck('id')->toArray();

        $count = $this->recorder->markAsBilled($ids);

        expect($count)->toBe(0);
    });
});

describe('ServiceUsageRecorder::getPendingBilling()', function () {
    test('devuelve registros pendientes de facturación', function () {
        // Crear registros facturables pendientes
        ServiceUsage::factory()->count(3)->create([
            'notaria_id' => $this->notaria->id,
            'billable' => true,
            'billed_at' => null,
        ]);

        // Crear registros ya facturados
        ServiceUsage::factory()->count(2)->create([
            'notaria_id' => $this->notaria->id,
            'billable' => true,
            'billed_at' => now(),
        ]);

        // Crear registros no facturables
        ServiceUsage::factory()->count(1)->create([
            'notaria_id' => $this->notaria->id,
            'billable' => false,
            'billed_at' => null,
        ]);

        $pending = $this->recorder->getPendingBilling();

        expect($pending)->toHaveCount(3);
    });

    test('filtra por notaría específica', function () {
        $otraNotaria = Notaria::factory()->create();

        ServiceUsage::factory()->count(2)->create([
            'notaria_id' => $this->notaria->id,
            'billable' => true,
            'billed_at' => null,
        ]);

        ServiceUsage::factory()->count(3)->create([
            'notaria_id' => $otraNotaria->id,
            'billable' => true,
            'billed_at' => null,
        ]);

        $pending = $this->recorder->getPendingBilling($this->notaria);

        expect($pending)->toHaveCount(2);
    });
});
