<?php

use App\Models\Notaria;
use App\Models\PepCuotaNotaria;
use App\Models\PepPaquetePld;

// ─── PepPaquetePld ───────────────────────────────────────────────────────────

test('reserva atinet es total menos asignadas', function (): void {
    $paquete = new PepPaquetePld([
        'total_busquedas' => 100,
        'busquedas_asignadas' => 60,
    ]);

    expect($paquete->reservaAtinet())->toBe(40);
});

test('reserva atinet nunca es negativa', function (): void {
    $paquete = new PepPaquetePld([
        'total_busquedas' => 50,
        'busquedas_asignadas' => 80,
    ]);

    expect($paquete->reservaAtinet())->toBe(0);
});

// ─── PepCuotaNotaria ─────────────────────────────────────────────────────────

test('disponibles calcula correctamente', function (): void {
    $cuota = new PepCuotaNotaria([
        'busquedas_asignadas' => 20,
        'busquedas_consumidas' => 7,
    ]);

    expect($cuota->disponibles())->toBe(13);
});

test('disponibles nunca es negativo', function (): void {
    $cuota = new PepCuotaNotaria([
        'busquedas_asignadas' => 10,
        'busquedas_consumidas' => 15,
    ]);

    expect($cuota->disponibles())->toBe(0);
});

test('consumir incrementa busquedas_consumidas', function (): void {
    $notaria = Notaria::factory()->create();

    $paquete = PepPaquetePld::create([
        'nombre_plan' => 'Plan Test',
        'total_busquedas' => 50,
        'busquedas_asignadas' => 20,
        'periodo_inicio' => now()->toDateString(),
        'activo' => true,
    ]);

    $cuota = PepCuotaNotaria::create([
        'notaria_id' => $notaria->id,
        'paquete_id' => $paquete->id,
        'busquedas_asignadas' => 10,
        'busquedas_consumidas' => 0,
        'activo' => true,
    ]);

    $cuota->consumir();

    expect($cuota->fresh()->busquedas_consumidas)->toBe(1);
});

test('consumir lanza excepcion si cuota agotada', function (): void {
    $cuota = new PepCuotaNotaria([
        'busquedas_asignadas' => 5,
        'busquedas_consumidas' => 5,
        'activo' => true,
    ]);

    expect(fn () => $cuota->consumir())->toThrow(\RuntimeException::class);
});

test('scope activa filtra cuotas vencidas', function (): void {
    $notaria = Notaria::factory()->create();

    $paquete = PepPaquetePld::create([
        'nombre_plan' => 'Plan Test',
        'total_busquedas' => 50,
        'busquedas_asignadas' => 20,
        'periodo_inicio' => now()->toDateString(),
        'activo' => true,
    ]);

    PepCuotaNotaria::create([
        'notaria_id' => $notaria->id,
        'paquete_id' => $paquete->id,
        'busquedas_asignadas' => 10,
        'busquedas_consumidas' => 0,
        'activo' => true,
        'fecha_vencimiento' => now()->subDay(),
    ]);

    $activa = PepCuotaNotaria::create([
        'notaria_id' => $notaria->id,
        'paquete_id' => $paquete->id,
        'busquedas_asignadas' => 20,
        'busquedas_consumidas' => 0,
        'activo' => true,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    $resultado = PepCuotaNotaria::activa()->where('notaria_id', $notaria->id)->get();

    expect($resultado)->toHaveCount(1)
        ->and($resultado->first()->id)->toBe($activa->id);
});
