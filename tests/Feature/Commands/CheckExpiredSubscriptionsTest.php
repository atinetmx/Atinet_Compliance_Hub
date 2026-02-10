<?php

/** @noinspection PhpUndefinedFieldInspection */

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Support\Facades\Artisan;

describe('CheckExpiredSubscriptions Command', function () {
    beforeEach(function () {
        // Crear plan de prueba
        $this->plan = Plan::factory()->create([
            'nombre' => 'Plan Test',
            'precio_mensual' => 999.00,
        ]);
    });

    test('marca suscripciones trial vencidas como vencidas y desactiva notaría inmediatamente', function () {
        // Crear notaría con suscripción trial vencida
        $notaria = Notaria::factory()->create(['activa' => true]);
        $subscription = Subscription::create([
            'notaria_id' => $notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_TRIAL,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->subDays(1), // Vencido ayer
            'precio_pagado' => 0,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
            'auto_renovacion' => false,
        ]);

        // Ejecutar comando
        Artisan::call('subscriptions:check-expired');

        // Verificar que la suscripción se marcó como vencida
        $subscription->refresh();
        expect($subscription->status)->toBe(Subscription::STATUS_VENCIDA);

        // Verificar que la notaría se desactivó
        $notaria->refresh();
        expect($notaria->activa)->toBeFalse();
    });

    test('marca suscripciones de pago vencidas como vencidas pero mantiene notaría activa', function () {
        // Crear notaría con suscripción de pago vencida (< 7 días)
        $notaria = Notaria::factory()->create(['activa' => true]);
        $subscription = Subscription::create([
            'notaria_id' => $notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_ACTIVA,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->subDays(3), // Vencido hace 3 días
            'precio_pagado' => 999.00,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
            'auto_renovacion' => true,
        ]);

        // Ejecutar comando
        Artisan::call('subscriptions:check-expired');

        // Verificar que la suscripción se marcó como vencida
        $subscription->refresh();
        expect($subscription->status)->toBe(Subscription::STATUS_VENCIDA);

        // Verificar que la notaría SIGUE activa (período de gracia)
        $notaria->refresh();
        expect($notaria->activa)->toBeTrue();
    });

    test('suspende suscripciones vencidas con más de 7 días y desactiva notaría', function () {
        // Crear notaría con suscripción vencida hace más de 7 días
        $notaria = Notaria::factory()->create(['activa' => true]);
        $subscription = Subscription::create([
            'notaria_id' => $notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_VENCIDA,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->subDays(10), // Vencido hace 10 días
            'precio_pagado' => 999.00,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
            'auto_renovacion' => true,
        ]);

        // Ejecutar comando
        Artisan::call('subscriptions:check-expired');

        // Verificar que la suscripción se suspendió
        $subscription->refresh();
        expect($subscription->status)->toBe(Subscription::STATUS_SUSPENDIDA);
        expect($subscription->razon_cancelacion)->toContain('período de gracia');

        // Verificar que la notaría se desactivó
        $notaria->refresh();
        expect($notaria->activa)->toBeFalse();
    });

    test('no afecta suscripciones activas vigentes', function () {
        // Crear notaría con suscripción activa
        $notaria = Notaria::factory()->create(['activa' => true]);
        $subscription = Subscription::create([
            'notaria_id' => $notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_ACTIVA,
            'fecha_inicio' => now()->subMonth(),
            'fecha_vencimiento' => now()->addMonth(), // Vigente por 1 mes más
            'precio_pagado' => 999.00,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
            'auto_renovacion' => true,
        ]);

        // Ejecutar comando
        Artisan::call('subscriptions:check-expired');

        // Verificar que no cambió nada
        $subscription->refresh();
        expect($subscription->status)->toBe(Subscription::STATUS_ACTIVA);

        $notaria->refresh();
        expect($notaria->activa)->toBeTrue();
    });

    test('modo dry-run no realiza cambios en la base de datos', function () {
        // Crear notaría con suscripción trial vencida
        $notaria = Notaria::factory()->create(['activa' => true]);
        $subscription = Subscription::create([
            'notaria_id' => $notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_TRIAL,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->subDays(1),
            'precio_pagado' => 0,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
            'auto_renovacion' => false,
        ]);

        // Ejecutar comando en dry-run
        Artisan::call('subscriptions:check-expired', ['--dry-run' => true]);

        // Verificar que NO cambió nada
        $subscription->refresh();
        expect($subscription->status)->toBe(Subscription::STATUS_TRIAL);

        $notaria->refresh();
        expect($notaria->activa)->toBeTrue();
    });

    test('procesa múltiples suscripciones correctamente', function () {
        // Trial vencido
        $notaria1 = Notaria::factory()->create(['activa' => true]);
        Subscription::create([
            'notaria_id' => $notaria1->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_TRIAL,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->subDay(),
            'precio_pagado' => 0,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
        ]);

        // Pago vencido (período de gracia)
        $notaria2 = Notaria::factory()->create(['activa' => true]);
        Subscription::create([
            'notaria_id' => $notaria2->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_ACTIVA,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->subDays(3),
            'precio_pagado' => 999.00,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
        ]);

        // Pago vencido (gracia agotada)
        $notaria3 = Notaria::factory()->create(['activa' => true]);
        Subscription::create([
            'notaria_id' => $notaria3->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_VENCIDA,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->subDays(10),
            'precio_pagado' => 999.00,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
        ]);

        // Ejecutar comando
        Artisan::call('subscriptions:check-expired');

        // Verificar resultados
        $notaria1->refresh();
        expect($notaria1->activa)->toBeFalse(); // Trial desactivado

        $notaria2->refresh();
        expect($notaria2->activa)->toBeTrue(); // Pago con gracia activo

        $notaria3->refresh();
        expect($notaria3->activa)->toBeFalse(); // Gracia agotada desactivado
    });

    test('verifica el período de gracia exacto de 7 días', function () {
        // Suscripción vencida hace exactamente 7 días (borde)
        $notaria = Notaria::factory()->create(['activa' => true]);
        $subscription = Subscription::create([
            'notaria_id' => $notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_VENCIDA,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->subDays(7), // Exactamente 7 días
            'precio_pagado' => 999.00,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
        ]);

        // Ejecutar comando
        Artisan::call('subscriptions:check-expired');

        // Con < 7 días no debería suspenderse aún
        // Pero con >= 7 días ya está fuera del período de gracia
        $subscription->refresh();
        expect($subscription->status)->toBe(Subscription::STATUS_SUSPENDIDA);

        $notaria->refresh();
        expect($notaria->activa)->toBeFalse();
    });
});
