<?php

use App\Models\Notaria;
use App\Models\PepCuotaNotaria;
use App\Models\PepPaquetePld;
use App\Models\User;
use App\Services\PepQuotaService;

// ─── Helpers ────────────────────────────────────────────────────────────────

function crearPaqueteActivo(int $total = 50, int $asignadas = 20): PepPaquetePld
{
    return PepPaquetePld::create([
        'nombre_plan' => 'Plan Test',
        'total_busquedas' => $total,
        'busquedas_asignadas' => $asignadas,
        'periodo_inicio' => now()->toDateString(),
        'activo' => true,
    ]);
}

function crearCuotaNotaria(Notaria $notaria, PepPaquetePld $paquete, int $asignadas = 10, int $consumidas = 0): PepCuotaNotaria
{
    return PepCuotaNotaria::create([
        'notaria_id' => $notaria->id,
        'paquete_id' => $paquete->id,
        'busquedas_asignadas' => $asignadas,
        'busquedas_consumidas' => $consumidas,
        'activo' => true,
    ]);
}

// ─── getPaqueteInfo ──────────────────────────────────────────────────────────

test('getPaqueteInfo retorna null para super admin sin paquete activo', function (): void {
    $user = User::factory()->create(['tipo_cuenta' => 'super_admin']);

    $info = app(PepQuotaService::class)->getPaqueteInfo($user);

    expect($info)->toBeNull();
});

test('getPaqueteInfo para super admin retorna datos del paquete activo', function (): void {
    $user = User::factory()->create(['tipo_cuenta' => 'super_admin']);
    crearPaqueteActivo(total: 50, asignadas: 30);

    $info = app(PepQuotaService::class)->getPaqueteInfo($user);

    expect($info)->toMatchArray([
        'total_contratado' => 50,
        'consumidas' => 30,
        'disponibles' => 20,
    ]);
});

test('getPaqueteInfo retorna null para usuario sin cuota asignada', function (): void {
    $notaria = Notaria::factory()->create();
    $user = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'usuario']);

    $info = app(PepQuotaService::class)->getPaqueteInfo($user);

    expect($info)->toBeNull();
});

test('getPaqueteInfo para usuario de notaria retorna datos de su cuota', function (): void {
    $notaria = Notaria::factory()->create();
    $user = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'usuario']);
    $paquete = crearPaqueteActivo();
    crearCuotaNotaria($notaria, $paquete, asignadas: 15, consumidas: 4);

    $info = app(PepQuotaService::class)->getPaqueteInfo($user);

    expect($info)->toMatchArray([
        'total_contratado' => 15,
        'consumidas' => 4,
        'disponibles' => 11,
    ]);
});

// ─── verificarDisponibilidad ─────────────────────────────────────────────────

test('verificarDisponibilidad siempre pasa para super admin', function (): void {
    $user = User::factory()->create(['tipo_cuenta' => 'super_admin']);

    expect(fn () => app(PepQuotaService::class)->verificarDisponibilidad($user))
        ->not->toThrow(\RuntimeException::class);
});

test('verificarDisponibilidad lanza excepcion si notaria no tiene cuota asignada', function (): void {
    $notaria = Notaria::factory()->create();
    $user = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'usuario']);

    expect(fn () => app(PepQuotaService::class)->verificarDisponibilidad($user))
        ->toThrow(\RuntimeException::class);
});

test('verificarDisponibilidad lanza excepcion si cuota agotada', function (): void {
    $notaria = Notaria::factory()->create();
    $user = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'usuario']);
    $paquete = crearPaqueteActivo();
    crearCuotaNotaria($notaria, $paquete, asignadas: 5, consumidas: 5);

    expect(fn () => app(PepQuotaService::class)->verificarDisponibilidad($user))
        ->toThrow(\RuntimeException::class);
});

test('verificarDisponibilidad pasa cuando hay tokens disponibles', function (): void {
    $notaria = Notaria::factory()->create();
    $user = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'usuario']);
    $paquete = crearPaqueteActivo();
    crearCuotaNotaria($notaria, $paquete, asignadas: 10, consumidas: 3);

    expect(fn () => app(PepQuotaService::class)->verificarDisponibilidad($user))
        ->not->toThrow(\RuntimeException::class);
});

// ─── consumir ────────────────────────────────────────────────────────────────

test('consumir no modifica nada para super admin', function (): void {
    $user = User::factory()->create(['tipo_cuenta' => 'super_admin']);
    $paquete = crearPaqueteActivo(total: 50, asignadas: 20);

    app(PepQuotaService::class)->consumir($user);

    expect($paquete->fresh()->busquedas_asignadas)->toBe(20);
});

test('consumir decrementa disponibles del usuario de notaria', function (): void {
    $notaria = Notaria::factory()->create();
    $user = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'usuario']);
    $paquete = crearPaqueteActivo();
    $cuota = crearCuotaNotaria($notaria, $paquete, asignadas: 10, consumidas: 2);

    app(PepQuotaService::class)->consumir($user);

    expect($cuota->fresh()->busquedas_consumidas)->toBe(3);
});

test('consumir lanza excepcion si notaria no tiene cuota asignada', function (): void {
    $notaria = Notaria::factory()->create();
    $user = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'usuario']);

    expect(fn () => app(PepQuotaService::class)->consumir($user))
        ->toThrow(\RuntimeException::class);
});
