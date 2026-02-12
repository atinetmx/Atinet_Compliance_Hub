<?php

namespace Tests\Feature\Middleware;

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckSubscriptionStatusTest extends TestCase
{
    use RefreshDatabase;

    protected Notaria $notaria;
    protected Plan $plan;
    protected User $user;

    public function setUp(): void
    {
        parent::setUp();

        // Crear plan
        $this->plan = Plan::factory()->create([
            'nombre' => 'Plan Test',
            'precio_mensual' => 999,
        ]);

        // Crear servicio OFAC
        $ofacService = \App\Models\Service::factory()->create([
            'code' => 'OFAC',
            'name' => 'Búsqueda OFAC',
        ]);

        // Asignar servicio al plan
        $this->plan->services()->attach($ofacService->id, [
            'is_included' => true,
            'usage_limit' => null, // Ilimitado
            'priority' => 1,
        ]);

        // Crear notaría
        $this->notaria = Notaria::factory()->create([
            'plan_id' => $this->plan->id,
            'activa' => true,
        ]);

        // Crear usuario
        $this->user = User::factory()->create([
            'notaria_id' => $this->notaria->id,
            'tipo_cuenta' => 'super_admin',
        ]);
    }

    /**
     * Test: Verificar que ServiceAccessManager valida correctamente
     */
    public function test_service_access_manager_validates_subscription(): void
    {
        // Sin suscripción, el acceso se debe denegar
        $accessManager = app(\App\Services\ServiceAccessManager::class);
        
        $canAccess = $accessManager->canAccess($this->notaria, 'OFAC');
        
        $this->assertFalse($canAccess, 'No debería permitir acceso sin suscripción');
    }

    /**
     * Test: Acceso permitido con suscripción activa
     */
    public function test_access_with_active_subscription(): void
    {
        // Crear suscripción activa
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_ACTIVA,
            'fecha_inicio' => now()->subMonth(),
            'fecha_vencimiento' => now()->addMonth(),
        ]);

        $accessManager = app(\App\Services\ServiceAccessManager::class);
        
        $canAccess = $accessManager->canAccess($this->notaria, 'OFAC');
        
        $this->assertTrue($canAccess, 'Debería permitir acceso con suscripción activa');
    }

    /**
     * Test: Acceso denegado en período de gracia (fecha_vencimiento < now)
     * 
     * El ServiceAccessManager requiere que fecha_vencimiento >= now()
     * Así que durante el período de gracia (cuando está vencida), 
     * el acceso se deniega automáticamente por el manager.
     * 
     * El middleware CheckSubscriptionStatus es el que permite acceso limitado
     * durante el período de gracia (solo lectura).
     */
    public function test_access_denied_in_grace_period_by_manager(): void
    {
        // Crear suscripción vencida hace 3 días (dentro del período de gracia)
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_VENCIDA,
            'fecha_vencimiento' => now()->subDays(3),
        ]);

        $accessManager = app(\App\Services\ServiceAccessManager::class);
        
        $canAccess = $accessManager->canAccess($this->notaria, 'OFAC');
        
        // ServiceAccessManager rechaza porque fecha_vencimiento < now()
        $this->assertFalse($canAccess, 'ServiceAccessManager rechaza suscripciones vencidas');
    }

    /**
     * Test: Acceso denegado fuera del período de gracia
     */
    public function test_access_denied_outside_grace_period(): void
    {
        // Crear suscripción vencida hace 10 días (fuera del período de gracia)
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_VENCIDA,
            'fecha_vencimiento' => now()->subDays(10),
        ]);

        $accessManager = app(\App\Services\ServiceAccessManager::class);
        
        $canAccess = $accessManager->canAccess($this->notaria, 'OFAC');
        
        $this->assertFalse($canAccess, 'No debería permitir acceso fuera del período de gracia');
    }

    /**
     * Test: Acceso denegado con suscripción suspendida
     */
    public function test_access_denied_with_suspended_subscription(): void
    {
        // Crear suscripción suspendida
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_SUSPENDIDA,
            'fecha_vencimiento' => now()->subDays(5),
        ]);

        $accessManager = app(\App\Services\ServiceAccessManager::class);
        
        $canAccess = $accessManager->canAccess($this->notaria, 'OFAC');
        
        $this->assertFalse($canAccess, 'No debería permitir acceso con suscripción suspendida');
    }

    /**
     * Test: Acceso denegado con suscripción cancelada
     */
    public function test_access_denied_with_cancelled_subscription(): void
    {
        // Crear suscripción cancelada
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_CANCELADA,
            'fecha_vencimiento' => now()->subDays(2),
        ]);

        $accessManager = app(\App\Services\ServiceAccessManager::class);
        
        $canAccess = $accessManager->canAccess($this->notaria, 'OFAC');
        
        $this->assertFalse($canAccess, 'No debería permitir acceso con suscripción cancelada');
    }

    /**
     * Test: Acceso permitido con suscripción trial
     */
    public function test_access_with_trial_subscription(): void
    {
        // Crear suscripción trial
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_TRIAL,
            'fecha_vencimiento' => now()->addDays(25),
        ]);

        $accessManager = app(\App\Services\ServiceAccessManager::class);
        
        $canAccess = $accessManager->canAccess($this->notaria, 'OFAC');
        
        $this->assertTrue($canAccess, 'Debería permitir acceso con suscripción trial');
    }

    /**
     * Test: Notaría inactiva se dennega acceso
     */
    public function test_access_denied_with_inactive_notaria(): void
    {
        // Crear suscripción activa pero notaría inactiva
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_ACTIVA,
            'fecha_vencimiento' => now()->addMonth(),
        ]);

        // Desactivar notaría
        $this->notaria->update(['activa' => false]);

        $accessManager = app(\App\Services\ServiceAccessManager::class);
        
        $canAccess = $accessManager->canAccess($this->notaria, 'OFAC');
        
        $this->assertFalse($canAccess, 'No debería permitir acceso si la notaría está inactiva');
    }

    /**
     * Test: CheckExpiredSubscriptions command marca correctamente trials vencidos
     */
    public function test_check_expired_subscriptions_handles_trials(): void
    {
        // Crear trial vencido
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_TRIAL,
            'fecha_vencimiento' => now()->subDay(),
        ]);

        // Ejecutar comando
        $this->artisan('subscriptions:check-expired')
            ->expectsOutput('🔄 Iniciando verificación de suscripciones vencidas...')
            ->assertExitCode(0);

        // Verificar que se marcó como vencida
        $subscription = $this->notaria->subscripciones()->first();
        $this->assertEquals(Subscription::STATUS_VENCIDA, $subscription->status);

        // Verificar que la notaría se desactivó
        $this->assertFalse($this->notaria->fresh()->activa);
    }

    /**
     * Test: CheckExpiredSubscriptions command inicia período de gracia
     */
    public function test_check_expired_subscriptions_grace_period(): void
    {
        // Crear suscripción activa que expira hoy
        Subscription::factory()->create([
            'notaria_id' => $this->notaria->id,
            'plan_id' => $this->plan->id,
            'status' => Subscription::STATUS_ACTIVA,
            'fecha_vencimiento' => now()->subMinute(), // Expiró hace poco
        ]);

        // Ejecutar comando
        $this->artisan('subscriptions:check-expired')
            ->assertExitCode(0);

        // Verificar que se marcó como vencida (período de gracia)
        $subscription = $this->notaria->subscripciones()->first();
        $this->assertEquals(Subscription::STATUS_VENCIDA, $subscription->status);

        // Verificar que la notaría AÚN SIGUE ACTIVA (período de gracia)
        $this->assertTrue($this->notaria->fresh()->activa);
    }
}
