<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class ImportAtinetUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:atinet-users
                            {--dry-run : Simular importación sin guardar cambios}
                            {--force : Importar sin confirmación}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importar usuarios del equipo Atinet desde la BD legacy como SuperAdmins';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('═══════════════════════════════════════════════════════');
        $this->info('   IMPORTACIÓN DE USUARIOS ATINET DESDE BD LEGACY');
        $this->info('═══════════════════════════════════════════════════════');
        $this->newLine();

        $isDryRun = $this->option('dry-run');
        $isForce = $this->option('force');

        if ($isDryRun) {
            $this->warn('⚠️  MODO DRY-RUN: No se guardarán cambios');
            $this->newLine();
        }

        // Paso 1: Obtener usuarios de Atinet desde BD legacy
        $this->info('📊 Paso 1: Consultando usuarios de Atinet en BD legacy...');

        // Usuarios a excluir (no son parte del equipo Atinet)
        $excluidos = ['NOTARIA4IXM'];

        try {
            $usuariosLegacy = DB::connection('aplicativos')
                ->table('usuario')
                ->where('notaria', 'atinet')
                ->whereNotIn('USER', $excluidos)
                ->orderBy('FECHA', 'desc')
                ->get();

            $this->info("   ✓ Encontrados: {$usuariosLegacy->count()} usuarios de Atinet");
            if (count($excluidos) > 0) {
                $this->info("   ℹ️  Usuarios excluidos: " . implode(', ', $excluidos));
            }
            $this->newLine();
        } catch (\Exception $e) {
            $this->error("   ✗ Error al conectar con BD legacy: {$e->getMessage()}");
            return Command::FAILURE;
        }

        if ($usuariosLegacy->isEmpty()) {
            $this->warn('⚠️  No se encontraron usuarios de Atinet en la BD legacy');
            return Command::SUCCESS;
        }

        // Paso 2: Mostrar usuarios a importar
        $this->info('📋 Paso 2: Usuarios a importar:');
        $this->newLine();

        $table = [];
        foreach ($usuariosLegacy as $usuario) {
            $email = $this->generateEmail($usuario);
            $exists = User::where('email', $email)->exists();

            $table[] = [
                'ID' => $usuario->id,
                'Usuario' => $usuario->USER,
                'Nombre' => trim(($usuario->NOMBRE ?? '') . ' ' . ($usuario->APELLIDO ?? '')),
                'Email' => $email,
                'Fecha Registro' => $usuario->FECHA ?? 'N/A',
                'Estado' => $exists ? '⚠️  Ya existe' : '✅ Nuevo',
            ];
        }

        $this->table(
            ['ID', 'Usuario', 'Nombre', 'Email', 'Fecha Registro', 'Estado'],
            $table
        );

        $this->newLine();

        // Contar nuevos y existentes
        $nuevosUsuarios = collect($table)->where('Estado', '✅ Nuevo')->count();
        $existentes = collect($table)->where('Estado', '⚠️  Ya existe')->count();

        $this->info("   Resumen:");
        $this->info("   • Nuevos usuarios a importar: {$nuevosUsuarios}");
        $this->info("   • Usuarios ya existentes (se omitirán): {$existentes}");
        $this->newLine();

        if ($nuevosUsuarios === 0) {
            $this->warn('⚠️  No hay usuarios nuevos para importar');
            return Command::SUCCESS;
        }

        // Paso 3: Confirmación
        if (!$isForce && !$isDryRun) {
            if (!$this->confirm("¿Desea continuar con la importación de {$nuevosUsuarios} usuario(s)?", true)) {
                $this->warn('❌ Importación cancelada por el usuario');
                return Command::SUCCESS;
            }
            $this->newLine();
        }

        // Paso 4: Importar usuarios
        $this->info('🚀 Paso 3: Importando usuarios...');
        $this->newLine();

        $importados = 0;
        $omitidos = 0;
        $errores = 0;

        $progressBar = $this->output->createProgressBar($usuariosLegacy->count());
        $progressBar->start();

        foreach ($usuariosLegacy as $usuario) {
            try {
                $email = $this->generateEmail($usuario);

                // Verificar si ya existe
                if (User::where('email', $email)->exists()) {
                    $omitidos++;
                    $progressBar->advance();
                    continue;
                }

                // Preparar datos del usuario
                $userData = [
                    'name' => trim(($usuario->NOMBRE ?? 'Usuario') . ' ' . ($usuario->APELLIDO ?? 'Atinet')),
                    'email' => $email,
                    'password' => Hash::make($usuario->PASSWORD ?? Str::random(16)),
                    'notaria_id' => null, // SuperAdmins no tienen notaría asignada
                    'tipo_cuenta' => 'super_admin',
                    'recoverable_password' => $this->encryptPassword($usuario->PASSWORD ?? null),
                    'email_verified_at' => now(),
                ];

                // Crear usuario (solo si NO es dry-run)
                if (!$isDryRun) {
                    User::create($userData);
                }

                $importados++;
            } catch (\Exception $e) {
                $errores++;
                $this->newLine();
                $this->error("   ✗ Error al importar usuario ID {$usuario->id}: {$e->getMessage()}");
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Paso 5: Resultados
        $this->info('═══════════════════════════════════════════════════════');
        $this->info('                    RESUMEN FINAL');
        $this->info('═══════════════════════════════════════════════════════');
        $this->newLine();

        if ($isDryRun) {
            $this->info('   ℹ️  MODO DRY-RUN: No se guardaron cambios');
            $this->info("   ✓ Se importarían: {$importados} usuario(s)");
        } else {
            $this->info("   ✅ Usuarios importados exitosamente: {$importados}");
        }

        $this->info("   ⚠️  Usuarios omitidos (ya existían): {$omitidos}");

        if ($errores > 0) {
            $this->error("   ❌ Errores durante la importación: {$errores}");
        }

        $this->newLine();
        $this->info('═══════════════════════════════════════════════════════');

        if (!$isDryRun && $importados > 0) {
            $this->newLine();
            $this->info('📧 IMPORTANTE: Los usuarios importados deben:');
            $this->info('   1. Verificar su email (se marcó como verificado)');
            $this->info('   2. Cambiar su contraseña en el primer login');
            $this->info('   3. Ya tienen rol de SuperAdmin asignado');
        }

        return Command::SUCCESS;
    }

    /**
     * Generate email from legacy user data
     */
    private function generateEmail($usuario): string
    {
        // Intentar generar email desde el username
        $username = strtolower($usuario->USER ?? '');
        $username = Str::slug($username); // Normalizar (remover espacios, etc.)

        // Si el username ya es un email, usarlo
        if (filter_var($usuario->USER, FILTER_VALIDATE_EMAIL)) {
            return strtolower($usuario->USER);
        }

        // Si no, generar email: usuario@atinet.com.mx
        return "{$username}@atinet.com.mx";
    }

    /**
     * Encrypt password for recoverable storage
     */
    private function encryptPassword(?string $password): ?string
    {
        if (!$password) {
            return null;
        }

        try {
            return Crypt::encryptString($password);
        } catch (\Exception $e) {
            return null;
        }
    }
}
