<?php

namespace Database\Seeders;

use App\Models\Busqueda;
use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder para crear datos de ejemplo que demuestran el funcionamiento
 * de los diferentes tipos de usuario y Global Scopes
 *
 * IMPORTANTE: Solo para desarrollo/testing
 */
class UserRoleExamplesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear planes de ejemplo
        $planBasico = Plan::firstOrCreate([
            'nombre' => 'Plan Básico',
        ], [
            'slug' => 'plan-basico',
            'descripcion' => 'Plan básico para notarías pequeñas',
            'precio_mensual' => 999.00,
            'precio_anual' => 9990.00,
            'limite_usuarios' => 5,
            'limite_busquedas_mes' => 100,
            'herramientas_activas' => ['busquedas', 'reportes_basicos'],
            'caracteristicas' => [
                'Hasta 5 usuarios',
                'Hasta 100 búsquedas por mes',
                'Búsquedas básicas',
                'Reportes básicos',
                'Soporte por email'
            ],
            'is_active' => true,
            'orden' => 1,
        ]);

        $planPremium = Plan::firstOrCreate([
            'nombre' => 'Plan Premium',
        ], [
            'slug' => 'plan-premium',
            'descripcion' => 'Plan premium para notarías grandes',
            'precio_mensual' => 2499.00,
            'precio_anual' => 24990.00,
            'limite_usuarios' => 25,
            'limite_busquedas_mes' => 1000,
            'herramientas_activas' => ['busquedas', 'reportes_basicos', 'reportes_avanzados', 'analytics'],
            'caracteristicas' => [
                'Hasta 25 usuarios',
                'Hasta 1000 búsquedas por mes',
                'Todas las herramientas',
                'Reportes avanzados',
                'Analytics y métricas',
                'Soporte prioritario 24/7'
            ],
            'is_active' => true,
            'orden' => 2,
        ]);

        // Crear notarías de ejemplo
        $notaria1 = Notaria::firstOrCreate([
            'numero_notaria' => '001',
        ], [
            'nombre' => 'Notaría Pública No. 1 - México',
            'plan_id' => $planBasico->id,
            'contacto_principal' => 'Lic. Juan Carlos Pérez',
            'email_contacto' => 'contacto@notaria001.mx',
            'telefono' => '+52 55 1234-5678',
            'direccion' => 'Av. Reforma 123, Col. Centro, Ciudad de México',
            'activa' => true,
            'fecha_registro' => now()->subMonths(6),
        ]);

        $notaria2 = Notaria::firstOrCreate([
            'numero_notaria' => '025',
        ], [
            'nombre' => 'Notaría Pública No. 25 - Guadalajara',
            'plan_id' => $planPremium->id,
            'contacto_principal' => 'Lic. María Elena González',
            'email_contacto' => 'info@notaria025.mx',
            'telefono' => '+52 33 9876-5432',
            'direccion' => 'Av. Chapultepec 456, Col. Americana, Guadalajara',
            'activa' => true,
            'fecha_registro' => now()->subMonths(12),
        ]);

        $notaria3 = Notaria::firstOrCreate([
            'numero_notaria' => '042',
        ], [
            'nombre' => 'Notaría Pública No. 42 - Monterrey',
            'plan_id' => $planBasico->id,
            'contacto_principal' => 'Lic. Roberto Hernández',
            'email_contacto' => 'contacto@notaria042.mx',
            'telefono' => '+52 81 5555-1234',
            'direccion' => 'Ave. Constitución 789, Col. Centro, Monterrey',
            'activa' => true,
            'fecha_registro' => now()->subMonths(3),
        ]);

        // Crear suscripciones activas
        Subscription::firstOrCreate([
            'notaria_id' => $notaria1->id,
        ], [
            'plan_id' => $planBasico->id,
            'fecha_inicio' => now()->subMonth(),
            'fecha_vencimiento' => now()->addMonth(),
            'status' => Subscription::STATUS_ACTIVA,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
            'precio_pagado' => $planBasico->precio_mensual,
            'metodo_pago' => 'tarjeta_credito',
            'moneda' => 'MXN',
            'auto_renovacion' => true,
        ]);

        Subscription::firstOrCreate([
            'notaria_id' => $notaria2->id,
        ], [
            'plan_id' => $planPremium->id,
            'fecha_inicio' => now()->subMonths(2),
            'fecha_vencimiento' => now()->addMonths(10),
            'status' => Subscription::STATUS_ACTIVA,
            'ciclo_facturacion' => Subscription::CICLO_ANUAL,
            'precio_pagado' => $planPremium->precio_anual,
            'metodo_pago' => 'transferencia',
            'moneda' => 'MXN',
            'auto_renovacion' => true,
        ]);

        // 🔥 CREAR SUPER_ADMIN (Empleado de Atinet)
        $superAdmin = User::firstOrCreate([
            'email' => 'admin@atinet.mx',
        ], [
            'name' => 'Super Administrador Atinet',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'tipo_cuenta' => 'super_admin',
            'notaria_id' => null, // Super admin no pertenece a ninguna notaría
        ]);

        // 🏢 CREAR ADMIN_NOTARIA para Notaría 1
        $adminNotaria1 = User::firstOrCreate([
            'email' => 'notario@notaria001.mx',
        ], [
            'name' => 'Lic. Juan Carlos Pérez (Notario)',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'tipo_cuenta' => 'admin_notaria',
            'notaria_id' => $notaria1->id,
        ]);

        // 🏢 CREAR ADMIN_NOTARIA para Notaría 2
        $adminNotaria2 = User::firstOrCreate([
            'email' => 'notario@notaria025.mx',
        ], [
            'name' => 'Lic. María Elena González (Notario)',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'tipo_cuenta' => 'admin_notaria',
            'notaria_id' => $notaria2->id,
        ]);

        // 👤 CREAR USUARIO_NOTARIA para Notaría 1
        $usuarioNotaria1 = User::firstOrCreate([
            'email' => 'usuario@notaria001.mx',
        ], [
            'name' => 'Ana Martínez (Secretaria)',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'tipo_cuenta' => 'usuario_notaria',
            'notaria_id' => $notaria1->id,
        ]);

        // 👤 CREAR USUARIO_NOTARIA para Notaría 2
        $usuarioNotaria2 = User::firstOrCreate([
            'email' => 'usuario@notaria025.mx',
        ], [
            'name' => 'Carlos Rodríguez (Asistente)',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'tipo_cuenta' => 'usuario_notaria',
            'notaria_id' => $notaria2->id,
        ]);

        // 👥 CREAR INVITADO para Notaría 1
        $invitadoNotaria1 = User::firstOrCreate([
            'email' => 'invitado@notaria001.mx',
        ], [
            'name' => 'Cliente Temporal (Invitado)',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'tipo_cuenta' => 'invitado',
            'notaria_id' => $notaria1->id,
        ]);

        // 👤 CREAR USUARIO para Notaría 3 (para que tenga búsquedas)
        $usuarioNotaria3 = User::firstOrCreate([
            'email' => 'usuario@notaria042.mx',
        ], [
            'name' => 'Pedro García (Usuario)',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'tipo_cuenta' => 'usuario_notaria',
            'notaria_id' => $notaria3->id,
        ]);

        // 🔍 CREAR BÚSQUEDAS DE EJEMPLO para demostrar Global Scope

        // Búsquedas de Notaría 1
        for ($i = 1; $i <= 15; $i++) {
            Busqueda::firstOrCreate([
                'notaria_id' => $notaria1->id,
                'user_id' => rand(0, 1) ? $adminNotaria1->id : $usuarioNotaria1->id,
                'tipo_busqueda' => rand(0, 1) ? 'rpp' : 'rppc',
                'termino_busqueda' => 'Búsqueda-' . str_pad($i, 4, '0', STR_PAD_LEFT),
            ], [
                'resultados' => [
                    'total_encontrados' => rand(1, 10),
                    'tiempo_busqueda' => rand(100, 500) . 'ms',
                    'status' => 'completada'
                ],
            ]);
        }

        // Búsquedas de Notaría 2
        for ($i = 1; $i <= 25; $i++) {
            Busqueda::firstOrCreate([
                'notaria_id' => $notaria2->id,
                'user_id' => rand(0, 1) ? $adminNotaria2->id : $usuarioNotaria2->id,
                'tipo_busqueda' => rand(0, 1) ? 'rpp' : 'rppc',
                'termino_busqueda' => 'Búsqueda-GDL-' . str_pad($i, 4, '0', STR_PAD_LEFT),
            ], [
                'resultados' => [
                    'total_encontrados' => rand(1, 15),
                    'tiempo_busqueda' => rand(150, 600) . 'ms',
                    'status' => 'completada'
                ],
            ]);
        }

        // Búsquedas de Notaría 3 (asignar al nuevo usuario)
        for ($i = 1; $i <= 8; $i++) {
            Busqueda::firstOrCreate([
                'notaria_id' => $notaria3->id,
                'user_id' => $usuarioNotaria3->id, // Ahora asignamos al usuario
                'tipo_busqueda' => 'rpp',
                'termino_busqueda' => 'Búsqueda-MTY-' . str_pad($i, 4, '0', STR_PAD_LEFT),
            ], [
                'resultados' => [
                    'total_encontrados' => rand(1, 5),
                    'tiempo_busqueda' => rand(80, 300) . 'ms',
                    'status' => 'pendiente'
                ],
            ]);
        }

        $this->command->info('✅ Datos de ejemplo creados exitosamente:');
        $this->command->info('🏢 3 Notarías creadas');
        $this->command->info('💰 2 Planes creados');
        $this->command->info('📄 2 Suscripciones activas');
        $this->command->info('👥 7 Usuarios de diferentes tipos creados');
        $this->command->info('🔍 48 Búsquedas de ejemplo creadas');
        $this->command->newLine();
        $this->command->info('🔐 Credenciales de prueba:');
        $this->command->info('Super Admin: admin@atinet.mx / password123');
        $this->command->info('Admin Notaría 1: notario@notaria001.mx / password123');
        $this->command->info('Admin Notaría 2: notario@notaria025.mx / password123');
        $this->command->info('Usuario Notaría 1: usuario@notaria001.mx / password123');
        $this->command->info('Usuario Notaría 2: usuario@notaria025.mx / password123');
        $this->command->info('Usuario Notaría 3: usuario@notaria042.mx / password123');
        $this->command->info('Invitado Notaría 1: invitado@notaria001.mx / password123');
    }
}
