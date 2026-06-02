<?php

use App\Models\Notaria;
use App\Models\User;

// ─── Helpers ────────────────────────────────────────────────────────────────

function notariaUserForCert(): User
{
    $notaria = Notaria::factory()->create();

    return User::factory()->create([
        'tipo_cuenta' => 'usuario',
        'notaria_id' => $notaria->id,
    ]);
}

function payloadSinCoincidencias(): array
{
    return [
        'apellido_denominacion' => 'García López',
        'nombres' => 'Juan',
        'identificacion' => 'GALJ800101001',
        'filtros_activos' => ['REFIPRE', 'OCDE'],
        'total_resultados' => 0,
        'fecha_consulta' => '2026-06-01 10:00:00',
        'resultados' => [],
    ];
}

function payloadConCoincidencia(): array
{
    return [
        'apellido_denominacion' => 'García López',
        'nombres' => 'Juan',
        'identificacion' => 'GALJ800101001',
        'filtros_activos' => ['REFIPRE'],
        'fecha_consulta' => '2026-06-01 10:00:00',
        'resultado' => [
            'denominacion' => 'JUAN GARCIA LOPEZ',
            'lista' => 'REFIPRE',
            'tipo' => 'Persona Física',
        ],
    ];
}

// ─── descargarListado ────────────────────────────────────────────────────────

test('usuario autenticado puede descargar listado refipre', function () {
    $this->actingAs(notariaUserForCert())
        ->get('/admin/listas-pep/listados/refipre')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});

test('usuario autenticado puede descargar listado ocde', function () {
    $this->actingAs(notariaUserForCert())
        ->get('/admin/listas-pep/listados/ocde')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});

test('usuario autenticado puede descargar listado gafi', function () {
    $this->actingAs(notariaUserForCert())
        ->get('/admin/listas-pep/listados/gafi')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});

test('tipo de listado invalido retorna 404', function () {
    $this->actingAs(notariaUserForCert())
        ->get('/admin/listas-pep/listados/inexistente')
        ->assertNotFound();
});

test('descarga de listado requiere autenticacion', function () {
    $this->get('/admin/listas-pep/listados/refipre')
        ->assertRedirect('/login');
});

// ─── certificadoSinCoincidencias ────────────────────────────────────────────

test('usuario autenticado puede generar certificado sin coincidencias', function () {
    $this->actingAs(notariaUserForCert())
        ->post('/admin/listas-pep/certificado/sin-coincidencias', payloadSinCoincidencias())
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});

test('certificado sin coincidencias requiere autenticacion', function () {
    $this->post('/admin/listas-pep/certificado/sin-coincidencias', payloadSinCoincidencias())
        ->assertRedirect('/login');
});

test('certificado sin coincidencias falla si faltan campos obligatorios', function () {
    $this->actingAs(notariaUserForCert())
        ->post('/admin/listas-pep/certificado/sin-coincidencias', [])
        ->assertSessionHasErrors(['apellido_denominacion', 'total_resultados', 'fecha_consulta', 'resultados']);
});

test('certificado sin coincidencias acepta campos opcionales nulos', function () {
    $payload = payloadSinCoincidencias();
    unset($payload['nombres'], $payload['identificacion']);

    $this->actingAs(notariaUserForCert())
        ->post('/admin/listas-pep/certificado/sin-coincidencias', $payload)
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});

// ─── certificadoConCoincidencia ──────────────────────────────────────────────

test('usuario autenticado puede generar certificado con coincidencia', function () {
    $this->actingAs(notariaUserForCert())
        ->post('/admin/listas-pep/certificado/con-coincidencia', payloadConCoincidencia())
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});

test('certificado con coincidencia requiere autenticacion', function () {
    $this->post('/admin/listas-pep/certificado/con-coincidencia', payloadConCoincidencia())
        ->assertRedirect('/login');
});

test('certificado con coincidencia falla si faltan campos obligatorios', function () {
    $this->actingAs(notariaUserForCert())
        ->post('/admin/listas-pep/certificado/con-coincidencia', [])
        ->assertSessionHasErrors(['apellido_denominacion', 'fecha_consulta', 'resultado']);
});

test('certificado con coincidencia falla si denominacion del resultado esta vacia', function () {
    $payload = payloadConCoincidencia();
    unset($payload['resultado']['denominacion']);

    $this->actingAs(notariaUserForCert())
        ->post('/admin/listas-pep/certificado/con-coincidencia', $payload)
        ->assertSessionHasErrors(['resultado.denominacion']);
});
