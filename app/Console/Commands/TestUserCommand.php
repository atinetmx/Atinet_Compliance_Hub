<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class TestUserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test user for debugging login';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Verificar si el usuario admin@atinet.mx existe
        $admin = User::where('email', 'admin@atinet.mx')->first();
        if ($admin) {
            $this->info("Usuario admin@atinet.mx existe: {$admin->tipo_cuenta}");
            $this->info("Password hash length: " . strlen($admin->password));
        } else {
            $this->error("Usuario admin@atinet.mx NO EXISTE");
        }

        // Crear usuario de prueba simple
        $testUser = User::firstOrCreate([
            'email' => 'test@atinet.mx'
        ], [
            'name' => 'Test User',
            'password' => Hash::make('123456'),
            'tipo_cuenta' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $this->info("Usuario test@atinet.mx creado/actualizado");
        $this->info("Total usuarios: " . User::count());
        
        return 0;
    }
}
