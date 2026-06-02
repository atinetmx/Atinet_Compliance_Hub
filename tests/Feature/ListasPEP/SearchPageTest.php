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

test('ruta buscar POST no esta activa mientras API esta bloqueada', function () {
    $this->actingAs($this->notariaUser)
        ->post('/admin/listas-pep/buscar', [
            'apellido_denominacion' => 'García',
            'filtros' => ['REFIPRE'],
        ])
        ->assertStatus(404);
});
