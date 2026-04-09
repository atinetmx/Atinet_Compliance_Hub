<?php

use App\Models\Notaria;
use App\Models\RegistroPersona;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Crear notaría para tests
    $this->notaria = Notaria::factory()->create([
        'legacy_identifier' => '001TEST',
        'numero_notaria' => '001',
        'nombre' => 'Notaría Test',
    ]);

    // Crear usuario asociado a la notaría
    $this->user = User::factory()->create([
        'notaria_id' => $this->notaria->id,
    ]);

    $this->actingAs($this->user);
});

describe('Validación de CURP', function () {
    test('rechaza CURP con formato inválido (menos de 18 caracteres)', function () {
        $response = $this->getJson('/admin/registro-web/search-curp?curp=ABCD123456');

        $response->assertStatus(422)
            ->assertJson([
                'found' => false,
                'message' => 'Formato de CURP inválido. Debe tener 18 caracteres alfanuméricos con el patrón: 4 letras + 6 dígitos + H/M + 5 letras + 1 alfanumérico + 1 dígito',
            ]);
    });

    test('rechaza CURP con formato inválido (patrón incorrecto)', function () {
        $response = $this->getJson('/admin/registro-web/search-curp?curp=123456789012345678');

        $response->assertStatus(422)
            ->assertJson([
                'found' => false,
            ]);
    });

    test('acepta CURP con formato válido', function () {
        $response = $this->getJson('/admin/registro-web/search-curp?curp=ABCD890512HDFRNN08');

        // Debería buscar correctamente (aunque no exista)
        $response->assertStatus(200)
            ->assertJson([
                'found' => false,
                'message' => 'No se encontró ningún registro con ese CURP',
                'curp_buscado' => 'ABCD890512HDFRNN08',
            ]);
    });

    test('normaliza CURP a mayúsculas automáticamente', function () {
        $response = $this->getJson('/admin/registro-web/search-curp?curp=abcd890512hdfrnn08');

        $response->assertStatus(200)
            ->assertJsonPath('curp_buscado', 'ABCD890512HDFRNN08');
    });

    test('valida género H o M en posición 11', function () {
        // CURP con X en lugar de H/M
        $response = $this->getJson('/admin/registro-web/search-curp?curp=ABCD890512XDFRNN08');

        $response->assertStatus(422);
    });
});

describe('Validación de RFC', function () {
    test('rechaza RFC con formato inválido (menos de 12 caracteres)', function () {
        $response = $this->getJson('/admin/registro-web/search-rfc?rfc=ABC123456');

        $response->assertStatus(422)
            ->assertJson([
                'found' => false,
                'message' => 'Formato de RFC inválido. Debe tener 12-13 caracteres con el patrón: 3-4 letras + 6 dígitos + 2-3 alfanuméricos',
            ]);
    });

    test('acepta RFC persona física (13 caracteres)', function () {
        $response = $this->getJson('/admin/registro-web/search-rfc?rfc=ABCD890512AB1');

        $response->assertStatus(200)
            ->assertJson([
                'found' => false,
                'message' => 'No se encontró ningún registro con ese RFC',
                'rfc_buscado' => 'ABCD890512AB1',
            ]);
    });

    test('acepta RFC persona moral (12 caracteres)', function () {
        $response = $this->getJson('/admin/registro-web/search-rfc?rfc=ABC890512AB1');

        $response->assertStatus(200)
            ->assertJson([
                'found' => false,
                'rfc_buscado' => 'ABC890512AB1',
            ]);
    });

    test('normaliza RFC a mayúsculas automáticamente', function () {
        $response = $this->getJson('/admin/registro-web/search-rfc?rfc=abc890512ab1');

        $response->assertStatus(200)
            ->assertJsonPath('rfc_buscado', 'ABC890512AB1');
    });

    test('acepta Ñ en RFC', function () {
        $response = $this->getJson('/admin/registro-web/search-rfc?rfc=AÑCD890512AB1');

        $response->assertStatus(200);
    });
});

describe('Validación en formulario store()', function () {
    test('persona física requiere CURP válido', function () {
        $response = $this->postJson('/admin/registro-web', [
            'persona' => 'fisica',
            'nombre' => 'Juan',
            'apellidopat' => 'Pérez',
            'apellidomat' => 'García',
            'rfc' => 'PEGJ890512AB1',
            'curp' => 'INVALIDO', // CURP inválido
            'correo' => 'test@test.com',
            'dia' => '1989-05-12',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['curp']);
    });

    test('persona moral no requiere CURP', function () {
        $response = $this->postJson('/admin/registro-web', [
            'persona' => 'moral',
            'nombre' => 'Empresa SA de CV',
            'rfc' => 'EMP890512AB1',
            'correo' => 'empresa@test.com',
            'notaria' => '001TEST',
        ]);

        // No debe fallar por falta de CURP
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    });

    test('persona física requiere apellidos', function () {
        $response = $this->postJson('/admin/registro-web', [
            'persona' => 'fisica',
            'nombre' => 'Juan',
            // Falta apellidopat
            'rfc' => 'PEGJ890512AB1',
            'curp' => 'PEGJ890512HDFRNN08',
            'correo' => 'test@test.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['apellidopat']);
    });

    test('persona moral no requiere apellidos', function () {
        $response = $this->postJson('/admin/registro-web', [
            'persona' => 'moral',
            'nombre' => 'Empresa SA de CV',
            'rfc' => 'EMP890512AB1',
            'correo' => 'empresa@test.com',
            'notaria' => '001TEST',
        ]);

        $response->assertStatus(200);
    });

    test('normaliza datos a mayúsculas automáticamente', function () {
        $response = $this->postJson('/admin/registro-web', [
            'persona' => 'fisica',
            'nombre' => 'juan',
            'apellidopat' => 'pérez',
            'apellidomat' => 'garcía',
            'rfc' => 'pegj890512ab1',
            'curp' => 'pegj890512hdfrnn08',
            'correo' => 'test@test.com',
            'notaria' => '001TEST',
            'dia' => '1989-05-12',
        ]);

        $response->assertStatus(200);

        $registro = RegistroPersona::first();
        expect($registro->nombre)->toBe('JUAN');
        expect($registro->apellidopat)->toBe('PÉREZ');
        expect($registro->rfc)->toBe('PEGJ890512AB1');
        expect($registro->curp)->toBe('PEGJ890512HDFRNN08');
    });

    test('detecta duplicados por CURP y actualiza en lugar de insertar', function () {
        // Crear registro inicial
        $registro = RegistroPersona::create([
            'persona' => 'fisica',
            'nombre' => 'JUAN',
            'apellidopat' => 'PEREZ',
            'apellidomat' => 'GARCIA',
            'curp' => 'PEGJ890512HDFRNN08',
            'rfc' => 'PEGJ890512AB1',
            'correo' => 'juan@test.com',
            'notaria' => '001TEST',
            'dia_registro' => now()->toDateString(),
        ]);

        // Intentar crear otro con mismo CURP
        $response = $this->postJson('/admin/registro-web', [
            'persona' => 'fisica',
            'nombre' => 'Juan Carlos',
            'apellidopat' => 'Pérez',
            'apellidomat' => 'García',
            'rfc' => 'PEGJ890512AB1',
            'curp' => 'PEGJ890512HDFRNN08', // Mismo CURP
            'correo' => 'juancarlos@test.com',
            'notaria' => '001TEST',
            'dia' => '1989-05-12',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'action' => 'actualizado', // Debe actualizar, no crear
            ]);

        // Verificar que solo existe 1 registro
        expect(RegistroPersona::count())->toBe(1);

        // Verificar que se actualizó el nombre
        $registro->refresh();
        expect($registro->nombre)->toBe('JUAN CARLOS');
    });
});
