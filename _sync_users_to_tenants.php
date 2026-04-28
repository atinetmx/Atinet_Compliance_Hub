<?php
/**
 * _sync_users_to_tenants.php
 *
 * Script de migración única: copia los usuarios existentes en la BD master
 * a sus respectivas BDs tenant (atinet_{estado}_notaria_{num}).
 *
 * Solo aplica a notarías que tienen BD tenant (tenantDatabaseName() no vacío).
 * LARAVEL_GW se omite — ya fue provisionado.
 *
 * Uso: php _sync_users_to_tenants.php
 */

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use App\Models\Notaria;
use App\Models\User;

echo "=== Sincronización de usuarios a BDs tenant ===\n\n";

$notarias = Notaria::all();

$totalCopiados = 0;
$totalActualizados = 0;
$totalOmitidos = 0;
$totalErrores = 0;

foreach ($notarias as $notaria) {
    $dbName = $notaria->tenantDatabaseName();

    if (empty($dbName)) {
        echo "[SKIP] Notaría {$notaria->numero_notaria} – {$notaria->nombre}: sin BD tenant configurada.\n";
        continue;
    }

    // Registrar conexión dinámica
    $connKey = 'cn_tenant_sync_' . $notaria->id;
    Config::set("database.connections.{$connKey}", [
        'driver'    => 'mysql',
        'host'      => config('database.connections.mysql.host'),
        'port'      => config('database.connections.mysql.port'),
        'database'  => $dbName,
        'username'  => config('database.connections.mysql.username'),
        'password'  => config('database.connections.mysql.password'),
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix'    => '',
        'strict'    => false,
    ]);

    // Verificar que la BD existe y tiene la tabla
    try {
        DB::connection($connKey)->getPdo();
        $tables = DB::connection($connKey)->select("SHOW TABLES LIKE 'tbl_cat_usuarios'");
        if (empty($tables)) {
            echo "[SKIP] Notaría {$notaria->numero_notaria} ({$dbName}): tabla tbl_cat_usuarios no existe.\n";
            continue;
        }
    } catch (\Throwable $e) {
        echo "[ERROR] Notaría {$notaria->numero_notaria} ({$dbName}): no se pudo conectar — {$e->getMessage()}\n";
        $totalErrores++;
        continue;
    }

    $usuarios = User::where('notaria_id', $notaria->id)->get();

    if ($usuarios->isEmpty()) {
        echo "[INFO] Notaría {$notaria->numero_notaria} ({$dbName}): sin usuarios en Laravel.\n";
        continue;
    }

    echo "\nNotaría {$notaria->numero_notaria} – {$notaria->nombre} ({$dbName}): {$usuarios->count()} usuario(s)\n";

    DB::connection($connKey)->statement('SET FOREIGN_KEY_CHECKS=0');

    foreach ($usuarios as $user) {
        try {
            // ── 1. Tabla users del tenant ────────────────────────────────
            $existeUserTenant = DB::connection($connKey)->table('users')
                ->where('id', $user->id)
                ->orWhere('email', $user->email)
                ->exists();

            if ($existeUserTenant) {
                DB::connection($connKey)->table('users')->where('email', $user->email)->update([
                    'name'              => $user->name,
                    'email'             => $user->email,
                    'password'          => $user->password,
                    'notaria_id'        => $user->notaria_id,
                    'cn_usuario_id'     => $user->cn_usuario_id,
                    'cn_rol_id'         => $user->cn_rol_id,
                    'cn_password'       => $user->cn_password,
                    'tipo_cuenta'       => $user->tipo_cuenta,
                    'updated_at'        => now(),
                ]);
                echo "  [users UPDATE] {$user->email}\n";
                $totalActualizados++;
            } else {
                DB::connection($connKey)->table('users')->insert([
                    'id'                    => $user->id,
                    'name'                  => $user->name,
                    'email'                 => $user->email,
                    'email_verified_at'     => $user->email_verified_at,
                    'password'              => $user->password,
                    'recoverable_password'  => $user->recoverable_password,
                    'notaria_id'            => $user->notaria_id,
                    'cn_usuario_id'         => $user->cn_usuario_id,
                    'cn_rol_id'             => $user->cn_rol_id,
                    'cn_password'           => $user->cn_password,
                    'tipo_cuenta'           => $user->tipo_cuenta,
                    'created_at'            => $user->created_at,
                    'updated_at'            => $user->updated_at,
                ]);
                echo "  [users INSERT] {$user->email}\n";
                $totalCopiados++;
            }

            // ── 2. Tabla tbl_cat_usuarios del tenant ─────────────────────
            $rolId = match($user->tipo_cuenta) {
                'super_admin'   => 1,
                'admin_notaria' => 2,
                default         => $user->cn_rol_id ?? 4,
            };

            $existeEnTenant = $user->cn_usuario_id
                ? DB::connection($connKey)->table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->exists()
                : false;

            if ($existeEnTenant) {
                DB::connection($connKey)->table('tbl_cat_usuarios')
                    ->where('Id', $user->cn_usuario_id)
                    ->update([
                        'Nombre'         => $user->name,
                        'Correo'         => $user->email,
                        'Rol_Id'         => $rolId,
                        'Numero_Notaria' => $notaria->numero_notaria,
                        'Activo'         => 1,
                        'Contrasena'     => str_replace('$2y$', '$2b$', $user->password),
                    ]);
                echo "  [cat_usuarios UPDATE] {$user->email} (Id={$user->cn_usuario_id})\n";
            } else {
                $usuario = strtoupper(explode('@', $user->email)[0]);

                $datosCN = [
                    'Nombre'         => $user->name,
                    'Correo'         => $user->email,
                    'Usuario'        => $usuario,
                    'Contrasena'     => str_replace('$2y$', '$2b$', $user->password),
                    'Rol_Id'         => $rolId,
                    'Numero_Notaria' => $notaria->numero_notaria,
                    'Activo'         => 1,
                    'Sesion_Iniciada'=> 0,
                    'Fecha_Creacion' => now(),
                ];

                if ($user->cn_usuario_id) {
                    $datosCN['Id'] = $user->cn_usuario_id;
                    DB::connection($connKey)->table('tbl_cat_usuarios')->insert($datosCN);
                    $cnId = $user->cn_usuario_id;
                    echo "  [cat_usuarios INSERT Id={$cnId}] {$user->email}\n";
                } else {
                    $cnId = DB::connection($connKey)->table('tbl_cat_usuarios')->insertGetId($datosCN);
                    User::withoutEvents(fn () => $user->updateQuietly(['cn_usuario_id' => $cnId]));
                    echo "  [cat_usuarios INSERT nuevo Id={$cnId}] {$user->email}\n";
                }

                // Reflejar cn_usuario_id actualizado también en users del tenant
                DB::connection($connKey)->table('users')->where('email', $user->email)->update(['cn_usuario_id' => $cnId]);
            }
        } catch (\Throwable $e) {
            echo "  [ERROR] {$user->email}: {$e->getMessage()}\n";
            $totalErrores++;
        }
    }

    DB::connection($connKey)->statement('SET FOREIGN_KEY_CHECKS=1');

    // Purgar conexión dinámica para liberar recursos
    DB::purge($connKey);
}

echo "\n=== Resumen ===\n";
echo "Insertados (nuevos) : {$totalCopiados}\n";
echo "Actualizados        : {$totalActualizados}\n";
echo "Omitidos            : {$totalOmitidos}\n";
echo "Errores             : {$totalErrores}\n";
echo "\nListo.\n";
