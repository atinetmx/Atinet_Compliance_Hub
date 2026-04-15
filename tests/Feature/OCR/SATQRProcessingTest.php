<?php

namespace Tests\Feature\OCR;

use App\Models\Notaria;
use App\Models\User;
use App\Services\SATScraperService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Tests para SAT QR Processing
 *
 * Verifica el procesamiento de QR codes del SAT (constancia fiscal)
 * con scraping del sitio del SAT y estructuración con Gemini AI.
 */
class SATQRProcessingTest extends TestCase
{
    use RefreshDatabase;

    protected string $validSATUrl = 'https://siat.sat.gob.mx/app/qr/faces/pages/mobile/validadorqr.jsf?D1=4&D2=1&D3=ABCD123456_ABCD890101ABC';

    protected string $invalidUrl = 'https://example.com/not-sat';

    protected User $user;

    protected Notaria $notaria;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear notaría y usuario para autenticación
        $this->notaria = Notaria::factory()->create([
            'legacy_identifier' => '001TEST',
            'numero_notaria' => '001',
            'nombre' => 'Notaría Test',
        ]);

        $this->user = User::factory()->create([
            'notaria_id' => $this->notaria->id,
        ]);

        // Autenticar usuario para todos los tests
        $this->actingAs($this->user);
    }

    /**
     * Test: Rechaza URL que no es del SAT
     */
    public function test_rechaza_url_no_sat(): void
    {
        $response = $this->postJson(route('admin.ocr.sat-qr'), [
            'url' => $this->invalidUrl,
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'La URL no corresponde a una constancia del SAT',
            ]);
    }

    /**
     * Test: Valida que el campo url es requerido
     */
    public function test_url_es_requerida(): void
    {
        $response = $this->postJson(route('admin.ocr.sat-qr'), []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    /**
     * Test: Valida que el campo url debe ser una URL válida
     */
    public function test_url_debe_ser_valida(): void
    {
        $response = $this->postJson(route('admin.ocr.sat-qr'), [
            'url' => 'not-a-valid-url',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    /**
     * Test: Procesa QR SAT válido (Persona Física)
     */
    public function test_procesa_qr_sat_valido_persona_fisica(): void
    {
        // Mock respuesta del SAT (HTML)
        $htmlResponse = $this->getMockSATHTML();

        // Mock HTTP client para simular cURL al SAT
        Http::preventStrayRequests();
        Http::fake([
            'siat.sat.gob.mx/*' => Http::response($htmlResponse, 200),
        ]);

        // Mock respuesta de Gemini AI
        $geminiResponse = [
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            [
                                'text' => json_encode([
                                    'Persona' => 'FISICA',
                                    'genero' => 'HOMBRE',
                                    'nombre' => 'JUAN',
                                    'apellidopat' => 'PEREZ',
                                    'apellidomat' => 'GARCIA',
                                    'rfc' => 'PEGJ890512AB1',
                                    'curp' => 'PEGJ890512HDFRNN08',
                                    'dia' => '1989-05-12',
                                    'correo' => 'juan@example.com',
                                    'regimen_fiscal' => '605',
                                    'calle_fiscal' => 'CALLE PRINCIPAL',
                                    'no_exterior_fiscal' => '123',
                                    'no_interior_fiscal' => '',
                                    'colonia_fiscal' => 'CENTRO',
                                    'cp_fiscal' => 42000,
                                    'municipio_fiscal' => 'PACHUCA',
                                    'estado_fiscal' => 'HIDALGO',
                                    'pais_fiscal' => 'MEXICO',
                                ]),
                            ],
                        ],
                    ],
                ],
            ],
        ];

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response($geminiResponse, 200),
        ]);

        $response = $this->postJson(route('admin.ocr.sat-qr'), [
            'url' => $this->validSATUrl,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Datos de constancia fiscal extraídos correctamente',
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'Persona',
                    'genero',
                    'nombre',
                    'apellidopat',
                    'apellidomat',
                    'rfc',
                    'curp',
                    'dia',
                    'correo',
                    'regimen_fiscal',
                    'calle_fiscal',
                    'no_exterior_fiscal',
                    'colonia_fiscal',
                    'cp_fiscal',
                    'municipio_fiscal',
                    'estado_fiscal',
                    'pais_fiscal',
                ],
                'message',
            ]);

        // Verificar datos específicos
        $this->assertEquals('FISICA', $response->json('data.Persona'));
        $this->assertEquals('PEGJ890512AB1', $response->json('data.rfc'));
        $this->assertEquals('JUAN', $response->json('data.nombre'));
    }

    /**
     * Test: Procesa QR SAT válido (Persona Moral)
     */
    public function test_procesa_qr_sat_valido_persona_moral(): void
    {
        $htmlResponse = $this->getMockSATHTML();

        Http::preventStrayRequests();
        Http::fake([
            'siat.sat.gob.mx/*' => Http::response($htmlResponse, 200),
        ]);

        $geminiResponse = [
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            [
                                'text' => json_encode([
                                    'Persona' => 'MORAL',
                                    'genero' => '',
                                    'nombre' => 'EMPRESA EJEMPLO SA DE CV',
                                    'apellidopat' => '',
                                    'apellidomat' => '',
                                    'rfc' => 'EEM010101ABC',
                                    'curp' => '',
                                    'dia' => '2001-01-01',
                                    'correo' => 'contacto@empresa.com',
                                    'regimen_fiscal' => '601',
                                    'calle_fiscal' => 'AVENIDA REFORMA',
                                    'no_exterior_fiscal' => '500',
                                    'no_interior_fiscal' => 'PISO 10',
                                    'colonia_fiscal' => 'JUAREZ',
                                    'cp_fiscal' => 6600,
                                    'municipio_fiscal' => 'CUAUHTEMOC',
                                    'estado_fiscal' => 'CIUDAD DE MEXICO',
                                    'pais_fiscal' => 'MEXICO',
                                ]),
                            ],
                        ],
                    ],
                ],
            ],
        ];

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response($geminiResponse, 200),
        ]);

        $response = $this->postJson(route('admin.ocr.sat-qr'), [
            'url' => $this->validSATUrl,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Verificar que es persona moral
        $this->assertEquals('MORAL', $response->json('data.Persona'));
        $this->assertEquals('EEM010101ABC', $response->json('data.rfc'));
        $this->assertEquals('', $response->json('data.curp'));
        $this->assertEquals('', $response->json('data.apellidopat'));
    }

    /**
     * Test: Maneja error de conexión con el SAT
     */
    public function test_maneja_error_conexion_sat(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'siat.sat.gob.mx/*' => Http::response('', 500),
        ]);

        $response = $this->postJson(route('admin.ocr.sat-qr'), [
            'url' => $this->validSATUrl,
        ]);

        $response->assertStatus(500)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Test: Maneja RFC sin cédula emitida
     */
    public function test_maneja_rfc_sin_cedula(): void
    {
        $htmlWithError = '<html><body>no se le ha emitido su Cédula fiscal</body></html>';

        Http::preventStrayRequests();
        Http::fake([
            'siat.sat.gob.mx/*' => Http::response($htmlWithError, 200),
        ]);

        $response = $this->postJson(route('admin.ocr.sat-qr'), [
            'url' => $this->validSATUrl,
        ]);

        $response->assertStatus(500)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonPath('message', 'RFC sin cédula fiscal emitida o datos inválidos');
    }

    /**
     * Test: Maneja error de Gemini (rate limit)
     */
    public function test_maneja_error_gemini_rate_limit(): void
    {
        $htmlResponse = $this->getMockSATHTML();

        Http::preventStrayRequests();
        Http::fake([
            'siat.sat.gob.mx/*' => Http::response($htmlResponse, 200),
            'generativelanguage.googleapis.com/*' => Http::response([
                'error' => [
                    'code' => 429,
                    'message' => 'Resource exhausted',
                ],
            ], 429),
        ]);

        $response = $this->postJson(route('admin.ocr.sat-qr'), [
            'url' => $this->validSATUrl,
        ]);

        $response->assertStatus(500)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonPath('message', 'Límite de uso de Gemini alcanzado. Intente más tarde.');
    }

    /**
     * Test: Normaliza campo 'persona' a 'Persona' MAYÚSCULAS
     */
    public function test_normaliza_tipo_persona(): void
    {
        $htmlResponse = $this->getMockSATHTML();

        Http::preventStrayRequests();
        Http::fake([
            'siat.sat.gob.mx/*' => Http::response($htmlResponse, 200),
        ]);

        // Gemini retorna 'persona' en minúscula
        $geminiResponse = [
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            [
                                'text' => json_encode([
                                    'persona' => 'fisica', // Minúscula
                                    'rfc' => 'TEST123456ABC',
                                    'nombre' => 'TEST',
                                    'apellidopat' => 'TEST',
                                    'apellidomat' => 'TEST',
                                    'dia' => '2000-01-01',
                                    'correo' => 'test@test.com',
                                    'regimen_fiscal' => '605',
                                    'calle_fiscal' => 'TEST',
                                    'no_exterior_fiscal' => '1',
                                    'no_interior_fiscal' => '',
                                    'colonia_fiscal' => 'TEST',
                                    'cp_fiscal' => 12345,
                                    'municipio_fiscal' => 'TEST',
                                    'estado_fiscal' => 'TEST',
                                    'pais_fiscal' => 'MEXICO',
                                ]),
                            ],
                        ],
                    ],
                ],
            ],
        ];

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response($geminiResponse, 200),
        ]);

        $response = $this->postJson(route('admin.ocr.sat-qr'), [
            'url' => $this->validSATUrl,
        ]);

        $response->assertStatus(200);

        // Verificar que se normalizó a 'Persona' en MAYÚSCULAS
        $this->assertEquals('FISICA', $response->json('data.Persona'));
        $this->assertArrayNotHasKey('persona', $response->json('data'));
    }

    /**
     * Test unitario: SATScraperService valida URL del SAT
     */
    public function test_servicio_valida_url_sat(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('La URL no corresponde a una constancia del SAT');

        $service = new SATScraperService;
        $service->processQRUrl('https://google.com');
    }

    /**
     * Helper: Generar HTML mock del SAT
     */
    protected function getMockSATHTML(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<body>
    <table>
        <tr><td>Nombre</td><td>JUAN PEREZ GARCIA</td></tr>
        <tr><td>RFC</td><td>PEGJ890512AB1</td></tr>
        <tr><td>CURP</td><td>PEGJ890512HDFRNN08</td></tr>
        <tr><td>Régimen Capital</td><td>605 - Sueldos y Salarios</td></tr>
        <tr><td>Correo</td><td>juan@example.com</td></tr>
        <tr><td>Domicilio</td><td>CALLE PRINCIPAL 123, CENTRO, PACHUCA, HIDALGO, CP 42000</td></tr>
    </table>
    <ul>
        <li>Fecha de nacimiento: 12 de Mayo de 1989</li>
        <li>Estado: HIDALGO</li>
    </ul>
</body>
</html>
HTML;
    }
}
