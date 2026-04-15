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

describe('Actualización de registros', function () {
    test('actualiza registro con datos válidos', function () {
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

        // Actualizar el registro
        $response = $this->putJson("/admin/registro-web/{$registro->id}", [
            'persona' => 'fisica',
            'nombre' => 'Juan Carlos',
            'apellidopat' => 'Pérez',
            'apellidomat' => 'García',
            'curp' => 'PEGJ890512HDFRNN08',
            'rfc' => 'PEGJ890512AB1',
            'correo' => 'juancarlos@test.com',
            'notaria' => '001TEST',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => "Registro #{$registro->id} actualizado correctamente",
            ]);

        // Verificar que se actualizó correctamente
        $registro->refresh();
        expect($registro->nombre)->toBe('JUAN CARLOS');
        expect($registro->correo)->toBe('juancarlos@test.com');
    });

    test('normaliza datos a mayúsculas en update', function () {
        $registro = RegistroPersona::create([
            'persona' => 'fisica',
            'nombre' => 'MARIA',
            'apellidopat' => 'LOPEZ',
            'apellidomat' => 'MARTINEZ',
            'curp' => 'LOMM900615MDFPRT09',
            'rfc' => 'LOMM900615AB2',
            'correo' => 'maria@test.com',
            'notaria' => '001TEST',
            'dia_registro' => now()->toDateString(),
        ]);

        $response = $this->putJson("/admin/registro-web/{$registro->id}", [
            'persona' => 'fisica',
            'nombre' => 'maría josé',
            'apellidopat' => 'lópez',
            'apellidomat' => 'martínez',
            'curp' => 'lomm900615mdfprt09',
            'rfc' => 'lomm900615ab2',
            'correo' => 'mariajose@test.com',
            'notaria' => '001TEST',
        ]);

        $response->assertStatus(200);

        $registro->refresh();
        expect($registro->nombre)->toBe('MARÍA JOSÉ');
        expect($registro->apellidopat)->toBe('LÓPEZ');
        expect($registro->apellidomat)->toBe('MARTÍNEZ');
        expect($registro->curp)->toBe('LOMM900615MDFPRT09');
        expect($registro->rfc)->toBe('LOMM900615AB2');
    });

    test('valida CURP en update', function () {
        $registro = RegistroPersona::create([
            'persona' => 'fisica',
            'nombre' => 'PEDRO',
            'apellidopat' => 'SANCHEZ',
            'apellidomat' => 'LOPEZ',
            'curp' => 'SALP850312HDFRND01',
            'rfc' => 'SALP850312AB3',
            'correo' => 'pedro@test.com',
            'notaria' => '001TEST',
            'dia_registro' => now()->toDateString(),
        ]);

        // Intentar actualizar con CURP inválido
        $response = $this->putJson("/admin/registro-web/{$registro->id}", [
            'persona' => 'fisica',
            'nombre' => 'Pedro',
            'apellidopat' => 'Sánchez',
            'apellidomat' => 'López',
            'curp' => 'INVALIDO123', // CURP inválido
            'rfc' => 'SALP850312AB3',
            'correo' => 'pedro@test.com',
            'notaria' => '001TEST',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['curp']);
    });

    test('puede cambiar de persona física a moral', function () {
        $registro = RegistroPersona::create([
            'persona' => 'fisica',
            'nombre' => 'LUIS',
            'apellidopat' => 'RAMIREZ',
            'apellidomat' => 'TORRES',
            'curp' => 'RATL920815HDFRRS02',
            'rfc' => 'RATL920815AB4',
            'correo' => 'luis@test.com',
            'notaria' => '001TEST',
            'dia_registro' => now()->toDateString(),
        ]);

        // Cambiar a persona moral (enviar null explícitamente para campos opcionales)
        $response = $this->putJson("/admin/registro-web/{$registro->id}", [
            'persona' => 'moral',
            'nombre' => 'Corporación RATL SA de CV',
            'apellidopat' => null, // Explícitamente null para persona moral
            'apellidomat' => null, // Explícitamente null para persona moral
            'curp' => null, // CURP opcional para moral
            'rfc' => 'CRA920815AB4',
            'correo' => 'corporacion@test.com',
            'notaria' => '001TEST',
        ]);

        $response->assertStatus(200);

        $registro->refresh();
        expect($registro->persona)->toBe('moral');
        expect($registro->nombre)->toBe('CORPORACIÓN RATL SA DE CV');
        expect($registro->apellidopat)->toBeNull();
        expect($registro->apellidomat)->toBeNull();
        expect($registro->curp)->toBeNull();
    });

    test('registro no encontrado devuelve 404', function () {
        $response = $this->putJson('/admin/registro-web/99999', [
            'persona' => 'fisica',
            'nombre' => 'Test',
            'apellidopat' => 'Test',
            'apellidomat' => 'Test',
            'curp' => 'TEST890512HDFTST08',
            'rfc' => 'TEST890512AB1',
            'correo' => 'test@test.com',
            'notaria' => '001TEST',
        ]);

        $response->assertStatus(404);
    });

    test('mantiene valores por defecto si no se envían', function () {
        $registro = RegistroPersona::create([
            'persona' => 'fisica',
            'nombre' => 'ANA',
            'apellidopat' => 'FERNANDEZ',
            'apellidomat' => 'RUIZ',
            'curp' => 'FERA880920MDFRNR05',
            'rfc' => 'FERA880920AB5',
            'correo' => 'ana@test.com',
            'notaria' => '001TEST',
            'dia_registro' => '2026-01-15',
            'pais' => 'MEXICO',
            'nacionalidad' => 'MEXICANA',
        ]);

        // Actualizar solo nombre y correo
        $response = $this->putJson("/admin/registro-web/{$registro->id}", [
            'persona' => 'fisica',
            'nombre' => 'Ana María',
            'apellidopat' => 'Fernández',
            'apellidomat' => 'Ruiz',
            'curp' => 'FERA880920MDFRNR05',
            'rfc' => 'FERA880920AB5',
            'correo' => 'anamaria@test.com',
            'notaria' => '001TEST',
        ]);

        $response->assertStatus(200);

        $registro->refresh();
        expect($registro->nombre)->toBe('ANA MARÍA');
        expect($registro->pais)->toBe('MEXICO');
        expect($registro->nacionalidad)->toBe('MEXICANA');
        expect($registro->dia_registro->format('Y-m-d'))->toBe('2026-01-15'); // Mantiene fecha original
    });
});
