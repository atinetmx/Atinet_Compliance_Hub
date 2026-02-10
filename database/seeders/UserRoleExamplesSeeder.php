<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder para crear datos iniciales del sistema:
 * - Planes disponibles
 * - Super Admin (único usuario inicial)
 *
 * Las notarías serán creadas por el Super Admin desde la interfaz
 */
class UserRoleExamplesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ✅ 1. CREAR PLANES DISPONIBLES
        $this->createPlans();

        // ✅ 2. CREAR SUPER ADMIN (único usuario inicial)
        $this->createSuperAdmin();

        $this->command->info('✅ Sistema inicializado:');
        $this->command->info('   - 3 planes creados');
        $this->command->info('   - Super Admin: admin@atinet.mx / password123');
        $this->command->info('');
        $this->command->warn('⚠️  Las notarías deben ser creadas desde el panel de Super Admin');
    }

    /**
     * Crear los planes disponibles del sistema
     */
    private function createPlans(): void
    {
        Plan::firstOrCreate([
            'nombre' => 'Plan Básico',
        ], [
            'slug' => 'plan-basico',
            'descripcion' => 'Plan básico para notarías pequeñas',
            'precio_mensual' => 499.00,
            'precio_anual' => 4990.00,
            'limite_usuarios' => 5,
            'limite_busquedas_mes' => 100,
            'herramientas_activas' => ['busquedas', 'reportes_basicos'],
            'caracteristicas' => [
                'Hasta 5 usuarios',
                'Hasta 100 búsquedas por mes',
                'Búsquedas básicas (SAT, OFAC)',
                'Dashboard básico',
                'Soporte por email',
            ],
            'is_active' => true,
            'orden' => 1,
        ]);

        Plan::firstOrCreate([
            'nombre' => 'Plan Profesional',
        ], [
            'slug' => 'plan-premium',
            'descripcion' => 'Plan profesional con herramientas avanzadas',
            'precio_mensual' => 999.00,
            'precio_anual' => 9990.00,
            'limite_usuarios' => 15,
            'limite_busquedas_mes' => 500,
            'herramientas_activas' => ['busquedas', 'reportes_basicos', 'reportes_avanzados', 'analytics'],
            'caracteristicas' => [
                'Hasta 15 usuarios',
                'Hasta 500 búsquedas por mes',
                'Todas las búsquedas ilimitadas',
                'Dashboard avanzado',
                'Reportes personalizados',
                'APIs y conectores',
                'Soporte prioritario',
            ],
            'is_active' => true,
            'orden' => 2,
        ]);

        Plan::firstOrCreate([
            'nombre' => 'Plan Empresa',
        ], [
            'slug' => 'plan-empresa',
            'descripcion' => 'Plan empresarial con todo ilimitado',
            'precio_mensual' => 1999.00,
            'precio_anual' => 19990.00,
            'limite_usuarios' => 50,
            'limite_busquedas_mes' => -1, // -1 = ilimitado
            'herramientas_activas' => ['busquedas', 'reportes_basicos', 'reportes_avanzados', 'analytics', 'apis'],
            'caracteristicas' => [
                'Usuarios ilimitados',
                'Búsquedas ilimitadas',
                'Todas las herramientas',
                'APIs ilimitadas',
                'Firma digital',
                'Capacitación mensual',
                'Soporte 24/7',
            ],
            'is_active' => true,
            'orden' => 3,
        ]);
    }

    /**
     * Crear el Super Admin inicial
     */
    private function createSuperAdmin(): void
    {
        User::firstOrCreate([
            'email' => 'admin@atinet.mx',
        ], [
            'name' => 'Super Administrador Atinet',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'tipo_cuenta' => 'super_admin',
            'notaria_id' => null, // Super admin no pertenece a ninguna notaría
        ]);
    }
}
