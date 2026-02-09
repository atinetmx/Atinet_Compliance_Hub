<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;

class UpdateRecoverablePasswordsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Actualizando contraseñas recuperables para usuarios existentes...');

        $users = User::whereIn('tipo_cuenta', ['admin_notaria', 'usuario_notaria'])
            ->whereNull('recoverable_password')
            ->get();

        foreach ($users as $user) {
            $user->update([
                'recoverable_password' => Crypt::encryptString('admin123')
            ]);

            $this->command->info("Usuario actualizado: {$user->email}");
        }

        $this->command->info("Proceso completado. Total usuarios actualizados: {$users->count()}");
    }
}
