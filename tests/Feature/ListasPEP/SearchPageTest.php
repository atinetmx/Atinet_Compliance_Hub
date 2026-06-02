<?php

use App\Models\Notaria;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->notaria = Notaria::factory()->create();

    $this->superAdmin = User::factory()->create([
        'tipo_cuenta' => 'super_admin',
        'notaria_id' => $this->notaria->id,
    ]);

    $this->notariaUser = User::factory()->create([
        'tipo_cuenta' => 'usuario',
        'notaria_id' => $this->notaria->id,
    ]);
});

test('super admin puede ver la pagina de busqueda PEP', function () {
    $this->actingAs($this->superAdmin)
        ->get('/admin/listas-pep')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ListasPEP/Search')
        );
});

test('usuario de notaria puede ver la pagina de busqueda PEP', function () {
    $this->actingAs($this->notariaUser)
        ->get('/admin/listas-pep')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ListasPEP/Search')
        );
});

test('usuario no autenticado es redirigido al login desde busqueda', function () {
    $this->get('/admin/listas-pep')
        ->assertRedirect('/login');
});

test('ruta buscar POST requiere autenticacion', function () {
    $this->postJson('/admin/listas-pep/buscar', [
        'apellido_denominacion' => 'García',
    ])
        ->assertStatus(401);
});

test('buscar POST devuelve 402 cuando notaria no tiene cuota asignada', function () {
    // notariaUser no tiene pep_cuotas_notaria asignada → sin cuota
    $this->actingAs($this->notariaUser)
        ->postJson('/admin/listas-pep/buscar', [
            'apellido_denominacion' => 'García',
        ])
        ->assertStatus(402)
        ->assertJsonPath('success', false);
});

test('ruta consumos GET requiere autenticacion', function () {
    $this->getJson('/admin/listas-pep/consumos')
        ->assertStatus(401);
});

test('consumos GET retorna estructura valida cuando el servicio responde', function () {
    $mock = Mockery::mock(\App\Services\PrevencionDeLavadoService::class);
    $mock->shouldReceive('getConsumos')->once()->andReturn([
        'success' => true,
        'data' => [
            'resultados' => [[
                'periodo'               => '31/12/2025 - 31/12/2026',
                'plan'                  => '50',
                'consultasDisponibles'  => 20,
                'consultasContratadas'  => 50,
                'importante'            => '',
                'tipoPlan'              => 'Demostración',
            ]],
            'resumen' => [
                'periodo'               => '31/12/2025 - 31/12/2026',
                'plan'                  => '50',
                'consultasDisponibles'  => 20,
                'consultasContratadas'  => 50,
                'importante'            => '',
                'tipoPlan'              => 'Demostración',
            ],
        ],
    ]);
    $this->app->instance(\App\Services\PrevencionDeLavadoService::class, $mock);

    $this->actingAs($this->superAdmin)
        ->getJson('/admin/listas-pep/consumos')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'success',
            'data' => [
                'resumen' => ['periodo', 'plan', 'consultasDisponibles', 'consultasContratadas', 'tipoPlan'],
            ],
        ]);
});

test('consumos GET retorna 503 cuando el servicio falla', function () {
    $mock = Mockery::mock(\App\Services\PrevencionDeLavadoService::class);
    $mock->shouldReceive('getConsumos')->once()->andReturn([
        'success'  => false,
        'message'  => 'Error de conexión con el servicio externo de listas PEP.',
    ]);
    $this->app->instance(\App\Services\PrevencionDeLavadoService::class, $mock);

    $this->actingAs($this->superAdmin)
        ->getJson('/admin/listas-pep/consumos')
        ->assertStatus(503)
        ->assertJsonPath('success', false);
});
