<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ejecutar seeders en orden correcto
        $this->call([
            UserRoleExamplesSeeder::class,  // 1. Planes + Super Admin
            ServicesSeeder::class,           // 2. Catálogo de servicios (16 servicios)
            PlanServicesSeeder::class,       // 3. Asignar servicios a planes
        ]);

        $this->command->info('');
        $this->command->info('🎉 Sistema listo para usar');
        $this->command->info('');
        $this->command->info('📋 Próximo paso:');
        $this->command->info('   1. Login como Super Admin: admin@atinet.mx / password123');
        $this->command->info('   2. Crear tu primera notaría desde el panel');
        $this->command->info('   3. Asignar plan y configurar servicios');
    }
}
