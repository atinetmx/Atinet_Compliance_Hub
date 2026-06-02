<?php

use App\Enums\EstadoMexico;

test('genera códigos cortos de estado correctamente', function () {
    expect(EstadoMexico::BAJA_CALIFORNIA_SUR->getCode())->toBe('bcs');
    expect(EstadoMexico::MEXICO->getCode())->toBe('edomex');
    expect(EstadoMexico::JALISCO->getCode())->toBe('jal');
    expect(EstadoMexico::CDMX->getCode())->toBe('cdmx');
    expect(EstadoMexico::NUEVO_LEON->getCode())->toBe('nl');
    expect(EstadoMexico::QUINTANA_ROO->getCode())->toBe('qroo');
});

test('obtiene código de estado desde nombre string', function () {
    expect(EstadoMexico::getCodeFromName('Baja California Sur'))->toBe('bcs');
    expect(EstadoMexico::getCodeFromName('México'))->toBe('edomex');
    expect(EstadoMexico::getCodeFromName('Jalisco'))->toBe('jal');
    expect(EstadoMexico::getCodeFromName('Ciudad de México'))->toBe('cdmx');
    expect(EstadoMexico::getCodeFromName(null))->toBe('default');
    expect(EstadoMexico::getCodeFromName('Estado Inexistente'))->toBe('default');
});

test('formato de nombre de base de datos incluye estado', function () {
    // Simular lo que hace createNotariaDatabase()
    $notaria = \App\Models\Notaria::factory()->make([
        'numero_notaria' => 21,
        'estado' => 'Baja California Sur',
    ]);

    $estadoCodigo = EstadoMexico::getCodeFromName($notaria->estado);
    $databaseName = "atinet_{$estadoCodigo}_notaria_{$notaria->numero_notaria}";

    expect($databaseName)->toBe('atinet_bcs_notaria_21');
});

test('formato de nombre de base de datos con diferentes estados', function () {
    $testCases = [
        ['estado' => 'México', 'numero' => 1, 'expected' => 'atinet_edomex_notaria_1'],
        ['estado' => 'Jalisco', 'numero' => 15, 'expected' => 'atinet_jal_notaria_15'],
        ['estado' => 'Nuevo León', 'numero' => 99, 'expected' => 'atinet_nl_notaria_99'],
        ['estado' => null, 'numero' => 1, 'expected' => 'atinet_default_notaria_1'],
    ];

    foreach ($testCases as $testCase) {
        $estadoCodigo = EstadoMexico::getCodeFromName($testCase['estado']);
        $databaseName = "atinet_{$estadoCodigo}_notaria_{$testCase['numero']}";

        expect($databaseName)->toBe($testCase['expected']);
    }
});
