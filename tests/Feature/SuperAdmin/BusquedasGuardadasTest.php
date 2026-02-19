<?php

use App\Http\Controllers\SuperAdmin\SuperAdminSearchController;
use App\Models\Busqueda;
use App\Models\Notaria;
use App\Models\Subscription;
use App\Models\User;
use App\Services\ServiceUsageRecorder;

/**
 * Subclase que expone saveSearchHistory() para testing directo
 * sin necesidad de mockear las BDs de OFAC/SAT
 */
class TestableSuperAdminSearchController extends SuperAdminSearchController
{
    public function guardarBusqueda(string $tipo, string $termino, array $ofac = [], array $sat = []): void
    {
        $this->saveSearchHistory($tipo, $termino, $ofac, $sat);
    }
}

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
function crearNotariaConSuscripcion(): Notaria
{
    $notaria = Notaria::factory()->create();
    Subscription::factory()->create([
        'notaria_id' => $notaria->id,
        'status' => Subscription::STATUS_ACTIVA,
        'fecha_vencimiento' => now()->addMonth(),
    ]);

    return $notaria;
}

function crearControlador(): TestableSuperAdminSearchController
{
    return new TestableSuperAdminSearchController(
        app(ServiceUsageRecorder::class)
    );
}

// ──────────────────────────────────────────────────────────────
// TESTS: GUARDADO POR TIPO DE USUARIO
// ──────────────────────────────────────────────────────────────
describe('Guardado de búsquedas por tipo de usuario', function () {

    describe('Super Admin (sin notaría asignada)', function () {

        test('la búsqueda se guarda en la tabla busquedas', function () {
            $superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);
            $this->actingAs($superAdmin);

            crearControlador()->guardarBusqueda('Persona Física', 'Juan García López');

            expect(Busqueda::count())->toBe(1);
        });

        test('la búsqueda se guarda con notaria_id null', function () {
            $superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);
            $this->actingAs($superAdmin);

            crearControlador()->guardarBusqueda('RFC', 'GAJU800101ABC');

            $busqueda = Busqueda::first();
            expect($busqueda->notaria_id)->toBeNull();
        });

        test('la búsqueda registra el user_id del super admin', function () {
            $superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);
            $this->actingAs($superAdmin);

            crearControlador()->guardarBusqueda('Persona Moral', 'Empresa SA de CV');

            $busqueda = Busqueda::first();
            expect($busqueda->user_id)->toBe($superAdmin->id);
        });

        test('la búsqueda registra el tipo y término correctamente', function () {
            $superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);
            $this->actingAs($superAdmin);

            crearControlador()->guardarBusqueda('Búsqueda Combinada', 'GAJU800101ABC / Juan García');

            $busqueda = Busqueda::first();
            expect($busqueda->tipo_busqueda)->toBe('Búsqueda Combinada')
                ->and($busqueda->termino_busqueda)->toBe('GAJU800101ABC / Juan García');
        });

        test('múltiples búsquedas de super admin se acumulan en la tabla', function () {
            $superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);
            $this->actingAs($superAdmin);

            $controlador = crearControlador();
            $controlador->guardarBusqueda('Persona Física', 'Juan García');
            $controlador->guardarBusqueda('RFC', 'GAJU800101ABC');
            $controlador->guardarBusqueda('Persona Moral', 'Empresa SA de CV');

            expect(Busqueda::count())->toBe(3);
        });
    });

    describe('Admin de Notaría', function () {

        test('la búsqueda se guarda con el notaria_id correcto', function () {
            $notaria = crearNotariaConSuscripcion();
            $admin = User::factory()->create([
                'notaria_id' => $notaria->id,
                'tipo_cuenta' => 'admin_notaria',
            ]);
            $this->actingAs($admin);

            crearControlador()->guardarBusqueda('Persona Física', 'María Pérez');

            $busqueda = Busqueda::first();
            expect($busqueda->notaria_id)->toBe($notaria->id)
                ->and($busqueda->user_id)->toBe($admin->id);
        });

        test('la búsqueda se guarda en la base de datos', function () {
            $notaria = crearNotariaConSuscripcion();
            $admin = User::factory()->create([
                'notaria_id' => $notaria->id,
                'tipo_cuenta' => 'admin_notaria',
            ]);
            $this->actingAs($admin);

            crearControlador()->guardarBusqueda('RFC', 'PEMA900202XYZ');

            expect(Busqueda::count())->toBe(1);
        });
    });

    describe('Usuario de Notaría', function () {

        test('la búsqueda se guarda con el notaria_id de su notaría', function () {
            $notaria = crearNotariaConSuscripcion();
            $usuario = User::factory()->create([
                'notaria_id' => $notaria->id,
                'tipo_cuenta' => 'usuario_notaria',
            ]);
            $this->actingAs($usuario);

            crearControlador()->guardarBusqueda('Persona Física', 'Carlos Sánchez');

            $busqueda = Busqueda::first();
            expect($busqueda->notaria_id)->toBe($notaria->id)
                ->and($busqueda->user_id)->toBe($usuario->id);
        });

        test('la búsqueda se guarda en la base de datos', function () {
            $notaria = crearNotariaConSuscripcion();
            $usuario = User::factory()->create([
                'notaria_id' => $notaria->id,
                'tipo_cuenta' => 'usuario_notaria',
            ]);
            $this->actingAs($usuario);

            crearControlador()->guardarBusqueda('Persona Moral', 'Constructora ABC SA');

            expect(Busqueda::count())->toBe(1);
        });
    });
});

// ──────────────────────────────────────────────────────────────
// TESTS: VISIBILIDAD SUPER ADMIN EN HISTORIAL
// ──────────────────────────────────────────────────────────────
describe('Super Admin puede ver todas las búsquedas en historial', function () {

    beforeEach(function () {
        $this->superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);
        $this->actingAs($this->superAdmin);
    });

    test('ve búsquedas propias (notaria_id null)', function () {
        Busqueda::factory()->create([
            'notaria_id' => null,
            'user_id' => $this->superAdmin->id,
        ]);

        $response = $this->getJson('/admin/search-history');

        $response->assertSuccessful();
        expect($response->json('data.total'))->toBe(1);
    });

    test('ve búsquedas de admins de notarías', function () {
        $notaria = crearNotariaConSuscripcion();
        $admin = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'admin_notaria']);

        Busqueda::factory()->count(2)->create([
            'notaria_id' => $notaria->id,
            'user_id' => $admin->id,
        ]);

        $response = $this->getJson('/admin/search-history');

        $response->assertSuccessful();
        expect($response->json('data.total'))->toBe(2);
    });

    test('ve búsquedas de usuarios de notarías', function () {
        $notaria = crearNotariaConSuscripcion();
        $usuario = User::factory()->create(['notaria_id' => $notaria->id, 'tipo_cuenta' => 'usuario_notaria']);

        Busqueda::factory()->count(3)->create([
            'notaria_id' => $notaria->id,
            'user_id' => $usuario->id,
        ]);

        $response = $this->getJson('/admin/search-history');

        $response->assertSuccessful();
        expect($response->json('data.total'))->toBe(3);
    });

    test('ve búsquedas de TODOS los tipos de usuario a la vez', function () {
        // Super admin (sin notaría)
        Busqueda::factory()->create([
            'notaria_id' => null,
            'user_id' => $this->superAdmin->id,
        ]);

        // Admin de notaría
        $notaria1 = crearNotariaConSuscripcion();
        $admin = User::factory()->create(['notaria_id' => $notaria1->id, 'tipo_cuenta' => 'admin_notaria']);
        Busqueda::factory()->count(2)->create(['notaria_id' => $notaria1->id, 'user_id' => $admin->id]);

        // Usuario de otra notaría
        $notaria2 = crearNotariaConSuscripcion();
        $usuario = User::factory()->create(['notaria_id' => $notaria2->id, 'tipo_cuenta' => 'usuario_notaria']);
        Busqueda::factory()->count(3)->create(['notaria_id' => $notaria2->id, 'user_id' => $usuario->id]);

        $response = $this->getJson('/admin/search-history');

        $response->assertSuccessful();
        // 1 super admin + 2 admin notaria + 3 usuario notaria = 6 total
        expect($response->json('data.total'))->toBe(6);
    });
});

// ──────────────────────────────────────────────────────────────
// TESTS: AISLAMIENTO DE DATOS POR NOTARÍA
// ──────────────────────────────────────────────────────────────
describe('Aislamiento de datos por notaría', function () {

    test('admin de notaría solo ve búsquedas de su propia notaría', function () {
        $notaria1 = crearNotariaConSuscripcion();
        $notaria2 = crearNotariaConSuscripcion();

        $admin1 = User::factory()->create(['notaria_id' => $notaria1->id, 'tipo_cuenta' => 'admin_notaria']);
        $usuario2 = User::factory()->create(['notaria_id' => $notaria2->id, 'tipo_cuenta' => 'usuario_notaria']);

        Busqueda::factory()->count(2)->create(['notaria_id' => $notaria1->id, 'user_id' => $admin1->id]);
        Busqueda::factory()->count(5)->create(['notaria_id' => $notaria2->id, 'user_id' => $usuario2->id]);

        $this->actingAs($admin1);
        $response = $this->getJson('/admin/search-history');

        $response->assertSuccessful();
        expect($response->json('data.total'))->toBe(2);
    });

    test('usuario de notaría solo ve búsquedas de su propia notaría', function () {
        $notaria1 = crearNotariaConSuscripcion();
        $notaria2 = crearNotariaConSuscripcion();

        $usuario1 = User::factory()->create(['notaria_id' => $notaria1->id, 'tipo_cuenta' => 'usuario_notaria']);
        $usuario2 = User::factory()->create(['notaria_id' => $notaria2->id, 'tipo_cuenta' => 'usuario_notaria']);

        Busqueda::factory()->count(3)->create(['notaria_id' => $notaria1->id, 'user_id' => $usuario1->id]);
        Busqueda::factory()->count(4)->create(['notaria_id' => $notaria2->id, 'user_id' => $usuario2->id]);

        $this->actingAs($usuario1);
        $response = $this->getJson('/admin/search-history');

        $response->assertSuccessful();
        expect($response->json('data.total'))->toBe(3);
    });

    test('super admin NO está limitado al aislamiento de notarías', function () {
        $notaria1 = crearNotariaConSuscripcion();
        $notaria2 = crearNotariaConSuscripcion();
        $superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);

        Busqueda::factory()->count(4)->create(['notaria_id' => $notaria1->id]);
        Busqueda::factory()->count(6)->create(['notaria_id' => $notaria2->id]);

        $this->actingAs($superAdmin);
        $response = $this->getJson('/admin/search-history');

        $response->assertSuccessful();
        expect($response->json('data.total'))->toBe(10);
    });
});
