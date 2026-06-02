<?php

use App\Models\ListaPepBusqueda;
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

test('super admin puede ver la página de historial', function () {
    $this->actingAs($this->superAdmin)
        ->get('/admin/listas-pep/historial')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ListasPEP/History')
            ->has('historial')
            ->has('filters')
            ->has('notarias')
            ->where('is_super_admin', true)
        );
});

test('usuario de notaría puede ver la página de historial', function () {
    $this->actingAs($this->notariaUser)
        ->get('/admin/listas-pep/historial')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ListasPEP/History')
            ->has('historial')
            ->where('is_super_admin', false)
            ->where('notarias', [])
        );
});

test('usuario no autenticado es redirigido al login', function () {
    $this->get('/admin/listas-pep/historial')
        ->assertRedirect('/login');
});

test('la prop filters refleja los query params recibidos', function () {
    $this->actingAs($this->superAdmin)
        ->get('/admin/listas-pep/historial?q=garcia&dias=7')
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.q', 'garcia')
            ->where('filters.dias', '7')
        );
});

test('la prop filters tiene valores por defecto cuando no hay query params', function () {
    $this->actingAs($this->superAdmin)
        ->get('/admin/listas-pep/historial')
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.q', null)
            ->where('filters.dias', 30)
        );
});

test('super admin ve búsquedas de todas las notarías', function () {
    $otraNotaria = Notaria::factory()->create();
    $otraUser = User::factory()->create(['notaria_id' => $otraNotaria->id, 'tipo_cuenta' => 'usuario']);

    ListaPepBusqueda::factory()->create(['user_id' => $this->notariaUser->id, 'notaria_id' => $this->notaria->id]);
    ListaPepBusqueda::factory()->create(['user_id' => $otraUser->id, 'notaria_id' => $otraNotaria->id]);

    $this->actingAs($this->superAdmin)
        ->get('/admin/listas-pep/historial')
        ->assertInertia(fn (Assert $page) => $page
            ->where('historial.total', 2)
        );
});

test('usuario de notaría solo ve búsquedas de su propia notaría', function () {
    $otraNotaria = Notaria::factory()->create();
    $otraUser = User::factory()->create(['notaria_id' => $otraNotaria->id, 'tipo_cuenta' => 'usuario']);

    ListaPepBusqueda::factory()->create(['user_id' => $this->notariaUser->id, 'notaria_id' => $this->notaria->id]);
    ListaPepBusqueda::factory()->create(['user_id' => $otraUser->id, 'notaria_id' => $otraNotaria->id]);

    $this->actingAs($this->notariaUser)
        ->get('/admin/listas-pep/historial')
        ->assertInertia(fn (Assert $page) => $page
            ->where('historial.total', 1)
        );
});

test('super admin puede filtrar por una notaría específica', function () {
    $otraNotaria = Notaria::factory()->create();
    $otraUser = User::factory()->create(['notaria_id' => $otraNotaria->id, 'tipo_cuenta' => 'usuario']);

    ListaPepBusqueda::factory()->create(['user_id' => $this->notariaUser->id, 'notaria_id' => $this->notaria->id]);
    ListaPepBusqueda::factory()->create(['user_id' => $otraUser->id, 'notaria_id' => $otraNotaria->id]);

    $this->actingAs($this->superAdmin)
        ->get("/admin/listas-pep/historial?notaria_id={$this->notaria->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('historial.total', 1)
            ->where('filters.notaria_id', $this->notaria->id)
        );
});

test('la prop notarias contiene todas las notarías para super admin', function () {
    $extra = Notaria::factory()->count(2)->create();

    $this->actingAs($this->superAdmin)
        ->get('/admin/listas-pep/historial')
        ->assertInertia(fn (Assert $page) => $page
            ->has('notarias', Notaria::count())
        );
});

test('usuario de notaría no puede ver búsquedas de otra notaría via notaria_id param', function () {
    $otraNotaria = Notaria::factory()->create();
    $otraUser = User::factory()->create(['notaria_id' => $otraNotaria->id, 'tipo_cuenta' => 'usuario']);

    ListaPepBusqueda::factory()->create(['user_id' => $otraUser->id, 'notaria_id' => $otraNotaria->id]);

    // El parámetro notaria_id es ignorado para usuarios no super-admin
    $this->actingAs($this->notariaUser)
        ->get("/admin/listas-pep/historial?notaria_id={$otraNotaria->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('historial.total', 0)
        );
});
