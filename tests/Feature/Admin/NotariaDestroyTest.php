<?php

namespace Tests\Feature\Admin;

use App\Models\Notaria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class NotariaDestroyTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected Notaria $notaria;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear super admin
        $this->superAdmin = User::factory()->create([
            'email' => 'superadmin@test.com',
            'password' => Hash::make('password123'),
            'tipo_cuenta' => 'super_admin',
        ]);

        // Crear notaría de prueba SIN usuarios
        $this->notaria = Notaria::factory()->create([
            'nombre' => 'Notaría de Prueba',
            'numero_notaria' => '999',
            'activa' => true,
        ]);
    }

    /** @test */
    public function super_admin_puede_ver_endpoint_destroy()
    {
        $this->actingAs($this->superAdmin);

        $response = $this->deleteJson(
            route('admin.notarias.destroy', $this->notaria),
            [
                'password' => 'password123',
                'reason' => 'Notaría de prueba que debe ser eliminada por testing',
            ]
        );

        $this->assertDatabaseMissing('notarias', [
            'id' => $this->notaria->id,
        ]);
    }

    /** @test */
    public function requiere_contraseña_correcta()
    {
        $this->actingAs($this->superAdmin);

        $response = $this->deleteJson(
            route('admin.notarias.destroy', $this->notaria),
            [
                'password' => 'contraseña_incorrecta',
                'reason' => 'Notaría de prueba que debe ser eliminada',
            ]
        );

        // La notaría NO debe ser eliminada
        $this->assertDatabaseHas('notarias', [
            'id' => $this->notaria->id,
        ]);
    }

    /** @test */
    public function requiere_razon_minima_10_caracteres()
    {
        $this->actingAs($this->superAdmin);

        $response = $this->deleteJson(
            route('admin.notarias.destroy', $this->notaria),
            [
                'password' => 'password123',
                'reason' => 'Corta', // Solo 5 caracteres
            ]
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors('reason');

        // La notaría NO debe ser eliminada
        $this->assertDatabaseHas('notarias', [
            'id' => $this->notaria->id,
        ]);
    }

    /** @test */
    public function no_puede_eliminar_notaria_con_usuarios()
    {
        // Crear un usuario asociado a la notaría
        User::factory()->create([
            'notaria_id' => $this->notaria->id,
            'tipo_cuenta' => 'notaria',
        ]);

        $this->actingAs($this->superAdmin);

        $response = $this->deleteJson(
            route('admin.notarias.destroy', $this->notaria),
            [
                'password' => 'password123',
                'reason' => 'Intentando eliminar notaría con usuarios activos',
            ]
        );

        // La notaría NO debe ser eliminada
        $this->assertDatabaseHas('notarias', [
            'id' => $this->notaria->id,
        ]);
    }

    /** @test */
    public function registra_log_critico_al_eliminar()
    {
        Log::spy();

        $this->actingAs($this->superAdmin);

        $this->deleteJson(
            route('admin.notarias.destroy', $this->notaria),
            [
                'password' => 'password123',
                'reason' => 'Notaría de prueba eliminada durante testing',
            ]
        );

        Log::shouldHaveReceived('critical')
            ->once()
            ->with('Notaría eliminada permanentemente', \Mockery::any());
    }

    /** @test */
    public function usuario_regular_no_puede_eliminar()
    {
        $notariaUser = User::factory()->create([
            'tipo_cuenta' => 'notaria',
        ]);

        $this->actingAs($notariaUser);

        $response = $this->deleteJson(
            route('admin.notarias.destroy', $this->notaria),
            [
                'password' => 'password123',
                'reason' => 'Intentando eliminar sin permisos',
            ]
        );

        $response->assertStatus(403);

        // La notaría NO debe ser eliminada
        $this->assertDatabaseHas('notarias', [
            'id' => $this->notaria->id,
        ]);
    }

    /** @test */
    public function debug_datos_recibidos_en_request()
    {
        $this->actingAs($this->superAdmin);

        // Interceptar el request para ver qué datos llegan
        $response = $this->call(
            'DELETE',
            route('admin.notarias.destroy', $this->notaria),
            [
                'password' => 'password123',
                'reason' => 'Test de datos en el request DELETE',
            ],
            [],
            [],
            [
                'HTTP_ACCEPT' => 'application/json',
                'CONTENT_TYPE' => 'application/json',
            ],
            json_encode([
                'password' => 'password123',
                'reason' => 'Test de datos en el request DELETE',
            ])
        );

        $response->assertStatus(302);
    }
}
