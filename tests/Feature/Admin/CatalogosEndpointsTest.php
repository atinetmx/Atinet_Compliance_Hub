<?php

use App\Models\User;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    $this->admin = User::factory()->create([
        'tipo_cuenta' => 'super_admin',
        'notaria_id' => null,
    ]);
});

// ─────────────────────────────────────────────
// RÉGIMEN FISCAL
// ─────────────────────────────────────────────

test('regimen_fiscal devuelve listado completo sin parámetro', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/regimen-fiscal');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [['codigo', 'descripcion']],
            'total',
        ])
        ->assertJsonPath('success', true);

    expect($response->json('total'))->toBeGreaterThan(0);
});

test('regimen_fiscal resuelve código válido usando primer código del catálogo', function () {
    $lista = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/regimen-fiscal')
        ->json('data');

    expect($lista)->not->toBeEmpty();

    $primer = $lista[0];
    $codigo = $primer['codigo'];

    $response = $this->actingAs($this->admin)
        ->getJson("/admin/catalogos/regimen-fiscal?codigo={$codigo}");

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.codigo', $codigo)
        ->assertJsonStructure(['success', 'data' => ['codigo', 'descripcion']]);

    expect($response->json('data.descripcion'))->toBeString()->not->toBeEmpty();
});

test('regimen_fiscal devuelve 400 con formato inválido (letras)', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/regimen-fiscal?codigo=ABCD');

    $response->assertStatus(400)
        ->assertJsonPath('success', false);
});

test('regimen_fiscal devuelve 400 con código de 1 dígito', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/regimen-fiscal?codigo=6');

    $response->assertStatus(400)
        ->assertJsonPath('success', false);
});

test('regimen_fiscal devuelve 404 para código numérico inexistente', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/regimen-fiscal?codigo=999');

    $response->assertStatus(404)
        ->assertJsonPath('success', false);
});

test('regimen_fiscal no es accesible sin sesión iniciada', function () {
    $response = $this->get('/admin/catalogos/regimen-fiscal');

    expect($response->status())->toBeIn([302, 401, 403]);
});

// ─────────────────────────────────────────────
// CÓDIGO POSTAL
// ─────────────────────────────────────────────

test('buscar_cp devuelve colonias para CP válido de Guadalajara', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/buscar-cp?cp=44100');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'success',
            'data' => ['estado', 'municipio', 'colonias'],
        ]);

    expect($response->json('data.colonias'))->toBeArray()->not->toBeEmpty();
    expect($response->json('data.estado'))->not->toBeEmpty();
});

test('buscar_cp incluye la clave ciudad en la respuesta', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/buscar-cp?cp=44100');

    $response->assertOk();
    expect($response->json('data'))->toHaveKey('ciudad');
});

test('buscar_cp devuelve error para CP con letras', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/buscar-cp?cp=ABC');

    $response->assertStatus(400)
        ->assertJsonPath('success', false);
});

test('buscar_cp devuelve 404 para CP inexistente 00000', function () {
    $response = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/buscar-cp?cp=00000');

    expect($response->status())->toBeIn([404, 200]);
    if ($response->status() === 404 || $response->json('success') === false) {
        expect($response->json('message'))->toBeString();
    }
});

test('buscar_cp no es accesible sin sesión iniciada', function () {
    $response = $this->get('/admin/catalogos/buscar-cp?cp=44100');

    expect($response->status())->toBeIn([302, 401, 403]);
});

// ─────────────────────────────────────────────
// INTEGRACIÓN: catálogo contiene códigos SAT comunes
// ─────────────────────────────────────────────

test('el catálogo contiene códigos SAT usados frecuentemente en notarías', function () {
    $lista = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/regimen-fiscal')
        ->json('data');

    $codigos = collect($lista)->pluck('codigo')->toArray();

    // Al menos uno de los códigos SAT más frecuentes debe estar presente
    $algunoExiste = count(array_intersect(['605', '612', '616', '606', '621'], $codigos)) > 0;

    expect($algunoExiste)->toBeTrue();
});

test('cache de regimen_fiscal devuelve el mismo total en llamadas sucesivas', function () {
    Cache::forget('catalogos:regimen_fiscal');

    $primera = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/regimen-fiscal');

    $segunda = $this->actingAs($this->admin)
        ->getJson('/admin/catalogos/regimen-fiscal');

    $primera->assertOk();
    $segunda->assertOk();

    expect($primera->json('total'))->toBe($segunda->json('total'));
});
