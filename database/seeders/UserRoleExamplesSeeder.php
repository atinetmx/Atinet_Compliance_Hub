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
        Plan::updateOrCreate(['slug' => 'plan-basico'], [
            'nombre' => 'Plan Básico',
            'descripcion' => 'Control Notarial, Agenda Web y búsquedas en listas negras para notarías pequeñas',
            'precio_mensual' => 1499.00,
            'precio_anual' => 14990.00,  // 2 meses gratis
            'limite_usuarios' => 2,
            'limite_busquedas_mes' => 50,
            'herramientas_activas' => ['control_notarial', 'agenda_web', 'busquedas_basicas'],
            'caracteristicas' => [
                '2 usuarios incluidos',
                'Control Notarial (Sistema ATINET)',
                'Agenda Web',
                'Registro Web (50 personas/mes)',
                'Lista Negra SAT (50 búsquedas/mes)',
                'Lista OFAC (50 búsquedas/mes)',
                'Escáner Inteligente (20 docs/mes)',
                'Soporte por email',
            ],
            'is_active' => true,
            'orden' => 1,
        ]);

        Plan::updateOrCreate(['slug' => 'plan-premium'], [
            'nombre' => 'Plan Profesional',
            'descripcion' => 'Todas las herramientas con mayor capacidad para notarías activas',
            'precio_mensual' => 2999.00,
            'precio_anual' => 29990.00,  // 2 meses gratis
            'limite_usuarios' => 5,
            'limite_busquedas_mes' => -1,  // ilimitado
            'herramientas_activas' => ['control_notarial', 'agenda_web', 'busquedas_avanzadas', 'registro_web', 'escaner'],
            'caracteristicas' => [
                '5 usuarios incluidos',
                'Control Notarial ilimitado',
                'Agenda Web ilimitada',
                'Registro Web (200 personas/mes)',
                'Búsquedas SAT y OFAC ilimitadas',
                'Escáner Inteligente (100 docs/mes)',
                'Soporte prioritario',
            ],
            'is_active' => true,
            'orden' => 2,
        ]);

        Plan::updateOrCreate(['slug' => 'plan-empresa'], [
            'nombre' => 'Plan Empresa',
            'descripcion' => 'Todo ilimitado para notarías con alto volumen de operaciones',
            'precio_mensual' => 5999.00,
            'precio_anual' => 59990.00,  // 2 meses gratis
            'limite_usuarios' => -1,  // ilimitado
            'limite_busquedas_mes' => -1,  // ilimitado
            'herramientas_activas' => ['control_notarial', 'agenda_web', 'busquedas_avanzadas', 'registro_web', 'escaner', 'apis'],
            'caracteristicas' => [
                'Usuarios ilimitados',
                'Control Notarial ilimitado',
                'Agenda Web ilimitada',
                'Registro Web ilimitado',
                'Búsquedas ilimitadas (SAT, OFAC)',
                'Escáner Inteligente ilimitado',
                'Capacitación mensual incluida',
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
