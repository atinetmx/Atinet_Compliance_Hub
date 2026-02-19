<?php

use App\Models\Busqueda;
use App\Models\Notaria;
use App\Models\User;

beforeEach(function () {
    $this->notaria = Notaria::factory()->create();
    $this->user = User::factory()->create([
        'notaria_id' => $this->notaria->id,
        'tipo_cuenta' => 'admin_notaria',
    ]);
});

test('puede crear una búsqueda con todos los campos requeridos', function () {
    $busqueda = Busqueda::create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'tipo_busqueda' => 'Persona Física',
        'termino_busqueda' => 'Juan Pérez',
        'resultados' => [
            'data' => [
                'ofac' => [],
                'sat' => [],
            ],
            'total' => 0,
            'timestamp' => now()->toIso8601String(),
        ],
    ]);

    expect($busqueda->tipo_busqueda)->toBe('Persona Física')
        ->and($busqueda->termino_busqueda)->toBe('Juan Pérez')
        ->and($busqueda->notaria_id)->toBe($this->notaria->id)
        ->and($busqueda->user_id)->toBe($this->user->id)
        ->and($busqueda->resultados)->toBeArray();
});

test('scope recientes filtra búsquedas por días', function () {
    // Búsqueda antigua (40 días atrás)
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'created_at' => now()->subDays(40),
    ]);

    // Búsqueda reciente (5 días atrás)
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'created_at' => now()->subDays(5),
    ]);

    $recientes = Busqueda::recientes(30)->get();

    expect($recientes->count())->toBe(1);
});

test('scope delUsuario filtra búsquedas por usuario', function () {
    $otroUsuario = User::factory()->create([
        'notaria_id' => $this->notaria->id,
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $otroUsuario->id,
    ]);

    $busquedasUsuario = Busqueda::delUsuario($this->user->id)->get();

    expect($busquedasUsuario->count())->toBe(1)
        ->and($busquedasUsuario->first()->user_id)->toBe($this->user->id);
});

test('scope delTipo filtra búsquedas por tipo', function () {
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'tipo_busqueda' => 'Persona Física',
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'tipo_busqueda' => 'RFC',
    ]);

    $busquedasFisicas = Busqueda::delTipo('Persona Física')->get();

    expect($busquedasFisicas->count())->toBe(1)
        ->and($busquedasFisicas->first()->tipo_busqueda)->toBe('Persona Física');
});

test('scope deLaNotaria filtra búsquedas por notaría', function () {
    $otraNotaria = Notaria::factory()->create();

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $otraNotaria->id,
    ]);

    $busquedasNotaria = Busqueda::deLaNotaria($this->notaria->id)->get();

    expect($busquedasNotaria->count())->toBe(1)
        ->and($busquedasNotaria->first()->notaria_id)->toBe($this->notaria->id);
});

test('scope porTermino filtra búsquedas por término', function () {
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'termino_busqueda' => 'Juan Pérez García',
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'termino_busqueda' => 'María González',
    ]);

    $busquedasJuan = Busqueda::porTermino('Juan')->get();

    expect($busquedasJuan->count())->toBe(1);
});

test('tieneResultados retorna true cuando hay resultados', function () {
    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'resultados' => [
            'data' => [
                'ofac' => [['nombre' => 'Test']],
                'sat' => [],
            ],
            'total' => 1,
        ],
    ]);

    expect($busqueda->tieneResultados())->toBeTrue();
});

test('tieneResultados retorna false cuando no hay resultados', function () {
    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'resultados' => [
            'data' => [
                'ofac' => [],
                'sat' => [],
            ],
            'total' => 0,
        ],
    ]);

    expect($busqueda->tieneResultados())->toBeFalse();
});

test('cantidadResultados retorna el total de resultados', function () {
    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'resultados' => [
            'total' => 5,
        ],
    ]);

    expect($busqueda->cantidadResultados())->toBe(5);
});

test('getResultadosOfac extrae resultados de OFAC', function () {
    $resultadosOfac = [
        ['nombre' => 'Test 1'],
        ['nombre' => 'Test 2'],
    ];

    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'resultados' => [
            'data' => [
                'ofac' => $resultadosOfac,
                'sat' => [],
            ],
        ],
    ]);

    expect($busqueda->getResultadosOfac())->toBeArray()
        ->and($busqueda->getResultadosOfac())->toHaveCount(2)
        ->and($busqueda->getResultadosOfac()[0]['nombre'])->toBe('Test 1');
});

test('getResultadosSat extrae resultados de SAT', function () {
    $resultadosSat = [
        ['rfc' => 'ABC123456789'],
    ];

    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'resultados' => [
            'data' => [
                'ofac' => [],
                'sat' => $resultadosSat,
            ],
        ],
    ]);

    expect($busqueda->getResultadosSat())->toBeArray()
        ->and($busqueda->getResultadosSat())->toHaveCount(1)
        ->and($busqueda->getResultadosSat()[0]['rfc'])->toBe('ABC123456789');
});

test('búsqueda pertenece a una notaría', function () {
    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
    ]);

    expect($busqueda->notaria)->toBeInstanceOf(Notaria::class)
        ->and($busqueda->notaria->id)->toBe($this->notaria->id);
});

test('búsqueda pertenece a un usuario', function () {
    $busqueda = Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
    ]);

    expect($busqueda->user)->toBeInstanceOf(User::class)
        ->and($busqueda->user->id)->toBe($this->user->id);
});

test('se pueden combinar múltiples scopes', function () {
    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'tipo_busqueda' => 'Persona Física',
        'created_at' => now()->subDays(5),
    ]);

    Busqueda::factory()->create([
        'notaria_id' => $this->notaria->id,
        'user_id' => $this->user->id,
        'tipo_busqueda' => 'RFC',
        'created_at' => now()->subDays(5),
    ]);

    $busquedas = Busqueda::recientes(30)
        ->delUsuario($this->user->id)
        ->delTipo('Persona Física')
        ->get();

    expect($busquedas->count())->toBe(1)
        ->and($busquedas->first()->tipo_busqueda)->toBe('Persona Física');
});
