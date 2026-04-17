<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SetCnPassword extends Command
{
    protected $signature = 'cn:set-password
                            {--user= : ID o email del usuario Laravel}
                            {--password= : Contraseña en texto plano}
                            {--all-pending : Muestra todos los usuarios sin cn_password}';

    protected $description = 'Establece la contraseña CN (cifrada) para un usuario Laravel.
                              Necesario para usuarios cuyo cn_password está vacío.';

    public function handle(): int
    {
        if ($this->option('all-pending')) {
            $this->listarPendientes();

            return self::SUCCESS;
        }

        $userIdentifier = $this->option('user') ?? $this->ask('ID o email del usuario');
        $password = $this->option('password') ?? $this->secret('Contraseña CN en texto plano');

        if (! $userIdentifier || ! $password) {
            $this->error('Se requiere --user y --password');

            return self::FAILURE;
        }

        $user = is_numeric($userIdentifier)
            ? User::find($userIdentifier)
            : User::where('email', $userIdentifier)->first();

        if (! $user) {
            $this->error("Usuario no encontrado: {$userIdentifier}");

            return self::FAILURE;
        }

        if (! $user->cn_usuario_id) {
            $this->warn("El usuario [{$user->id}] {$user->name} no tiene cn_usuario_id asignado.");

            return self::FAILURE;
        }

        $cnUsuario = DB::table('tbl_cat_usuarios')
            ->where('Id', $user->cn_usuario_id)
            ->value('Usuario');

        $user->update(['cn_password' => encrypt($password)]);

        $this->info("✓ cn_password actualizado para [{$user->id}] {$user->name} (CN usuario: {$cnUsuario})");

        return self::SUCCESS;
    }

    private function listarPendientes(): void
    {
        $pendientes = User::whereNull('cn_password')
            ->whereNotNull('cn_usuario_id')
            ->get(['id', 'name', 'email', 'cn_usuario_id']);

        if ($pendientes->isEmpty()) {
            $this->info('✅ Todos los usuarios con cn_usuario_id tienen cn_password configurado.');

            return;
        }

        $this->warn('Usuarios con cn_usuario_id pero sin cn_password:');
        $this->table(
            ['ID', 'Nombre', 'Email', 'cn_usuario_id'],
            $pendientes->map(fn ($u) => [$u->id, $u->name, $u->email, $u->cn_usuario_id])->toArray()
        );
        $this->line('');
        $this->line('Usa: php artisan cn:set-password --user=<id_o_email> --password=<contraseña>');
    }
}
