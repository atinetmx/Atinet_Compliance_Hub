<?php

use App\Services\OpenAIDocumentAnalyzer;
use Illuminate\Support\Facades\Http;

describe('OpenAIDocumentAnalyzer::analyzeTestamento', function () {
    it('retorna estructura completa de un testamento desde texto plano', function () {
        $respuestaOpenAI = [
            'choices' => [[
                'message' => [
                    'content' => json_encode([
                        'testador' => ['nombre' => 'ANGÉLICA MATA ALDERETE', 'curp' => '', 'estado_civil' => 'casada'],
                        'familia' => [
                            'padre' => '',
                            'madre' => '',
                            'conyuge' => '',
                            'hijos' => ['KRISTIAN DANIEL LÓPEZ MATA', 'SOPHIA MAYLENE LÓPEZ MATA'],
                        ],
                        'herederos' => ['principales' => ['KRISTIAN DANIEL LÓPEZ MATA'], 'sustitutos' => []],
                        'tutores' => ['principal' => 'CARLOS EDUARDO LÓPEZ MARTINEZ', 'sustituto' => ''],
                        'albaceas' => ['principal' => 'CARLOS EDUARDO LÓPEZ MARTINEZ', 'sustituto' => ''],
                        'metadatos' => ['escritura' => '123', 'volumen' => '', 'libro' => '', 'fecha' => '', 'notario' => '', 'notaria_numero' => ''],
                    ]),
                ],
            ]],
            'model' => 'gpt-4o-mini',
            'usage' => ['total_tokens' => 800],
        ];

        Http::fake([
            'api.openai.com/*' => Http::response($respuestaOpenAI, 200),
        ]);

        config(['services.openai.api_key' => 'sk-test-key']);

        $analyzer = new OpenAIDocumentAnalyzer;
        $resultado = $analyzer->analyzeTestamento('compareció la señora ANGÉLICA MATA ALDERETE...');

        expect($resultado)->toBeArray()
            ->and($resultado['testador']['nombre'])->toBe('ANGÉLICA MATA ALDERETE')
            ->and($resultado['familia']['hijos'])->toHaveCount(2)
            ->and($resultado['tutores']['principal'])->toBe('CARLOS EDUARDO LÓPEZ MARTINEZ')
            ->and($resultado['herederos'])->toHaveKey('principales')
            ->and($resultado['herederos'])->toHaveKey('sustitutos')
            ->and($resultado['metadatos'])->toHaveKey('escritura');
    });

    it('maneja texto con datos anonimizados devolviendo campos vacíos', function () {
        $respuestaOpenAI = [
            'choices' => [[
                'message' => [
                    'content' => json_encode([
                        'testador' => ['nombre' => '', 'curp' => '', 'estado_civil' => ''],
                        'familia' => ['padre' => '', 'madre' => '', 'conyuge' => '', 'hijos' => []],
                        'herederos' => ['principales' => [], 'sustitutos' => []],
                        'tutores' => ['principal' => '', 'sustituto' => ''],
                        'albaceas' => ['principal' => '', 'sustituto' => ''],
                        'metadatos' => ['escritura' => '', 'volumen' => '', 'libro' => '', 'fecha' => '', 'notario' => '', 'notaria_numero' => ''],
                    ]),
                ],
            ]],
            'model' => 'gpt-4o-mini',
            'usage' => ['total_tokens' => 400],
        ];

        Http::fake([
            'api.openai.com/*' => Http::response($respuestaOpenAI, 200),
        ]);

        config(['services.openai.api_key' => 'sk-test-key']);

        $analyzer = new OpenAIDocumentAnalyzer;
        $resultado = $analyzer->analyzeTestamento('compareció la Señora XXXXXXXXXXXXXXX...');

        expect($resultado['testador']['nombre'])->toBe('')
            ->and($resultado['familia']['hijos'])->toBeEmpty()
            ->and($resultado['herederos']['principales'])->toBeEmpty();
    });
});
