<?php

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;

beforeEach(function () {
    $this->superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);
    $this->actingAs($this->superAdmin);

    /** @noinspection PhpUndefinedFieldInspection */
    $this->plan = Plan::factory()->create([
        'nombre' => 'Plan Test',
        'precio_mensual' => 1000,
        'precio_anual' => 10000,
    ]);

    /** @noinspection PhpUndefinedFieldInspection */
    $this->notaria = Notaria::factory()->create([
        'numero_notaria' => 1,
        'nombre' => 'Notaría Test',
        'activa' => false,
    ]);
});

test('creating an active subscription activates the notaria', function () {
    $response = $this->post(route('admin.subscriptions.store'), [
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => 'activa',
        'fecha_inicio' => now()->toDateString(),
        'fecha_vencimiento' => now()->addMonths(1)->toDateString(),
        'precio_pagado' => 1000,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
        'auto_renovacion' => true,
    ]);

    $response->assertRedirect();

    $this->notaria->refresh();
    expect($this->notaria->activa)->toBeTrue();
});

test('creating a trial subscription activates the notaria', function () {
    $response = $this->post(route('admin.subscriptions.store'), [
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => 'trial',
        'fecha_inicio' => now()->toDateString(),
        'fecha_vencimiento' => now()->addDays(15)->toDateString(),
        'precio_pagado' => 0,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
        'auto_renovacion' => false,
    ]);

    $response->assertRedirect();

    $this->notaria->refresh();
    expect($this->notaria->activa)->toBeTrue();
});

test('creating a suspended subscription does not activate the notaria', function () {
    $response = $this->post(route('admin.subscriptions.store'), [
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => 'suspendida',
        'fecha_inicio' => now()->toDateString(),
        'fecha_vencimiento' => now()->addMonths(1)->toDateString(),
        'precio_pagado' => 1000,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
        'auto_renovacion' => false,
    ]);

    $response->assertRedirect();

    $this->notaria->refresh();
    expect($this->notaria->activa)->toBeFalse();
});

test('renewing a subscription reactivates the notaria', function () {
    /** @noinspection PhpUndefinedFieldInspection */
    $subscription = Subscription::create([
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => 'vencida',
        'fecha_inicio' => now()->subMonths(2),
        'fecha_vencimiento' => now()->subDays(5),
        'precio_pagado' => 1000,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
    ]);

    $this->notaria->update(['activa' => false]);

    $response = $this->post(route('admin.subscriptions.renew', $subscription), [
        'duracion_meses' => 3,
        'precio_pagado' => 3000,
    ]);

    $response->assertRedirect();

    $subscription->refresh();
    $this->notaria->refresh();

    expect($subscription->status)->toBe('activa')
        ->and($this->notaria->activa)->toBeTrue();
});

test('changing status to active reactivates the notaria', function () {
    /** @noinspection PhpUndefinedFieldInspection */
    $subscription = Subscription::create([
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => 'suspendida',
        'fecha_inicio' => now()->subMonth(),
        'fecha_vencimiento' => now()->addMonth(),
        'precio_pagado' => 1000,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
    ]);

    $this->notaria->update(['activa' => false]);

    $response = $this->post(route('admin.subscriptions.change-status', $subscription), [
        'status' => 'activa',
    ]);

    $response->assertRedirect();

    $this->notaria->refresh();
    expect($this->notaria->activa)->toBeTrue();
});

test('changing status to suspended deactivates the notaria', function () {
    $this->notaria->update(['activa' => true]);

    /** @noinspection PhpUndefinedFieldInspection */
    $subscription = Subscription::create([
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => 'activa',
        'fecha_inicio' => now()->subMonth(),
        'fecha_vencimiento' => now()->addMonth(),
        'precio_pagado' => 1000,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
    ]);

    $response = $this->post(route('admin.subscriptions.change-status', $subscription), [
        'status' => 'suspendida',
    ]);

    $response->assertRedirect();

    $this->notaria->refresh();
    expect($this->notaria->activa)->toBeFalse();
});

test('changing status to cancelled deactivates the notaria', function () {
    $this->notaria->update(['activa' => true]);

    /** @noinspection PhpUndefinedFieldInspection */
    $subscription = Subscription::create([
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => 'activa',
        'fecha_inicio' => now()->subMonth(),
        'fecha_vencimiento' => now()->addMonth(),
        'precio_pagado' => 1000,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
    ]);

    $response = $this->post(route('admin.subscriptions.change-status', $subscription), [
        'status' => 'cancelada',
        'razon_cancelacion' => 'Solicitud del cliente',
    ]);

    $response->assertRedirect();

    $this->notaria->refresh();
    expect($this->notaria->activa)->toBeFalse();
});

test('updating subscription status from vencida to activa reactivates notaria', function () {
    /** @noinspection PhpUndefinedFieldInspection */
    $subscription = Subscription::create([
        'notaria_id' => $this->notaria->id,
        'plan_id' => $this->plan->id,
        'status' => 'vencida',
        'fecha_inicio' => now()->subMonths(2),
        'fecha_vencimiento' => now()->subDays(5),
        'precio_pagado' => 1000,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
    ]);

    $this->notaria->update(['activa' => false]);

    $response = $this->put(route('admin.subscriptions.update', $subscription), [
        'plan_id' => $this->plan->id,
        'status' => 'activa',
        'fecha_inicio' => $subscription->fecha_inicio->toDateString(),
        'fecha_vencimiento' => now()->addMonths(1)->toDateString(),
        'precio_pagado' => 1000,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
        'auto_renovacion' => true,
    ]);

    $response->assertRedirect();

    $subscription->refresh();
    $this->notaria->refresh();

    expect($subscription->status)->toBe('activa')
        ->and($this->notaria->activa)->toBeTrue();
});
