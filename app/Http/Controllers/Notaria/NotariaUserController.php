<?php

namespace App\Http\Controllers\Notaria;

use App\Enums\EstadoMexico;
use App\Http\Controllers\Controller;
use App\Models\Notaria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class NotariaUserController extends Controller
{
    /**
     * Lista de usuarios de la notaría (desde BD tenant)
     */
    public function index()
    {
        $this->checkAdminNotaria();

        $user = Auth::user();
        $notaria = $user->notaria;

        if (! $notaria) {
            abort(403, 'Tu cuenta no está asignada a ninguna notaría.');
        }

        // Conectar a BD tenant y obtener usuarios
        $users = $this->executeInTenantDatabase($notaria, function ($connection) {
            return DB::connection($connection)
                ->table('users')
                ->select('id', 'name', 'email', 'tipo_cuenta', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get();
        });

        // Obtener información del plan para verificar límites
        $subscription = $notaria->subscripcionActiva;
        $plan = $subscription?->plan;

        return Inertia::render('Notaria/Users/Index', [
            'users' => $users,
            'notaria' => [
                'id' => $notaria->id,
                'nombre' => $notaria->nombre,
                'numero_notaria' => $notaria->numero_notaria,
            ],
            'limits' => [
                'current' => count($users),
                'max' => $plan?->limite_usuarios ?? 5,
                'can_delete' => $this->canDeleteUsers($plan),
            ],
            'plan' => [
                'nombre' => $plan?->nombre ?? 'Sin Plan',
                'tiene_dashboard_avanzado' => $this->hasDashboardAvanzado($plan),
            ],
        ]);
    }

    /**
     * Formulario para crear nuevo usuario
     */
    public function create()
    {
        $this->checkAdminNotaria();

        $user = Auth::user();
        $notaria = $user->notaria;

        if (! $notaria) {
            abort(403, 'Tu cuenta no está asignada a ninguna notaría.');
        }

        // Verificar límite de usuarios
        $subscription = $notaria->subscripcionActiva;
        $plan = $subscription?->plan;
        $limiteUsuarios = $plan?->limite_usuarios ?? 5;

        $usuariosActuales = $this->executeInTenantDatabase($notaria, function ($connection) {
            return DB::connection($connection)->table('users')->count();
        });

        if ($usuariosActuales >= $limiteUsuarios && $limiteUsuarios !== -1) {
            return redirect()->route('notaria.users.index')
                ->with('error', "Has alcanzado el límite de {$limiteUsuarios} usuarios de tu plan. Contacta a Atinet para ampliar tu suscripción.");
        }

        return Inertia::render('Notaria/Users/Create', [
            'notaria' => [
                'id' => $notaria->id,
                'nombre' => $notaria->nombre,
            ],
        ]);
    }

    /**
     * Guardar nuevo usuario en BD tenant
     */
    public function store(Request $request)
    {
        $this->checkAdminNotaria();

        $user = Auth::user();
        $notaria = $user->notaria;

        if (! $notaria) {
            abort(403, 'Tu cuenta no está asignada a ninguna notaría.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'tipo_cuenta' => ['required', 'in:admin_notaria,usuario_notaria,invitado'],
        ]);

        // Verificar límite de usuarios
        $subscription = $notaria->subscripcionActiva;
        $plan = $subscription?->plan;
        $limiteUsuarios = $plan?->limite_usuarios ?? 5;

        $usuariosActuales = $this->executeInTenantDatabase($notaria, function ($connection) {
            return DB::connection($connection)->table('users')->count();
        });

        if ($usuariosActuales >= $limiteUsuarios && $limiteUsuarios !== -1) {
            return back()->withErrors([
                'limit' => "Has alcanzado el límite de {$limiteUsuarios} usuarios de tu plan.",
            ]);
        }

        try {
            // Verificar si el email ya existe en la BD tenant
            $existingUser = $this->executeInTenantDatabase($notaria, function ($connection) use ($validated) {
                return DB::connection($connection)
                    ->table('users')
                    ->where('email', $validated['email'])
                    ->exists();
            });

            if ($existingUser) {
                return back()->withErrors([
                    'email' => 'Este correo electrónico ya está registrado en tu notaría.',
                ])->withInput();
            }

            // Crear usuario en BD tenant
            $this->executeInTenantDatabase($notaria, function ($connection) use ($validated, $notaria) {
                DB::connection($connection)->table('users')->insert([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'tipo_cuenta' => $validated['tipo_cuenta'],
                    'notaria_id' => $notaria->id,
                    'recoverable_password' => Crypt::encryptString($validated['password']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

            return redirect()->route('notaria.users.index')
                ->with('success', 'Usuario creado exitosamente.');

        } catch (\Exception $e) {
            Log::error('Error al crear usuario en BD tenant', [
                'notaria_id' => $notaria->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'error' => 'Ocurrió un error al crear el usuario. Por favor intenta nuevamente.',
            ])->withInput();
        }
    }

    /**
     * Mostrar formulario de edición
     */
    public function edit($id)
    {
        $this->checkAdminNotaria();

        $user = Auth::user();
        $notaria = $user->notaria;

        if (! $notaria) {
            abort(403, 'Tu cuenta no está asignada a ninguna notaría.');
        }

        $tenantUser = $this->executeInTenantDatabase($notaria, function ($connection) use ($id) {
            return DB::connection($connection)
                ->table('users')
                ->where('id', $id)
                ->first();
        });

        if (! $tenantUser) {
            abort(404, 'Usuario no encontrado.');
        }

        return Inertia::render('Notaria/Users/Edit', [
            'user' => [
                'id' => $tenantUser->id,
                'name' => $tenantUser->name,
                'email' => $tenantUser->email,
                'tipo_cuenta' => $tenantUser->tipo_cuenta,
            ],
            'notaria' => [
                'id' => $notaria->id,
                'nombre' => $notaria->nombre,
            ],
        ]);
    }

    /**
     * Actualizar usuario en BD tenant
     */
    public function update(Request $request, $id)
    {
        $this->checkAdminNotaria();

        $user = Auth::user();
        $notaria = $user->notaria;

        if (! $notaria) {
            abort(403, 'Tu cuenta no está asignada a ninguna notaría.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'tipo_cuenta' => ['required', 'in:admin_notaria,usuario_notaria,invitado'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        try {
            // Verificar si el email ya existe (excepto el usuario actual)
            $existingUser = $this->executeInTenantDatabase($notaria, function ($connection) use ($validated, $id) {
                return DB::connection($connection)
                    ->table('users')
                    ->where('email', $validated['email'])
                    ->where('id', '!=', $id)
                    ->exists();
            });

            if ($existingUser) {
                return back()->withErrors([
                    'email' => 'Este correo electrónico ya está registrado en tu notaría.',
                ])->withInput();
            }

            // Actualizar usuario
            $updateData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'tipo_cuenta' => $validated['tipo_cuenta'],
                'updated_at' => now(),
            ];

            // Si se proporcionó nueva contraseña
            if (! empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
                $updateData['recoverable_password'] = Crypt::encryptString($validated['password']);
            }

            $this->executeInTenantDatabase($notaria, function ($connection) use ($id, $updateData) {
                DB::connection($connection)
                    ->table('users')
                    ->where('id', $id)
                    ->update($updateData);
            });

            return redirect()->route('notaria.users.index')
                ->with('success', 'Usuario actualizado exitosamente.');

        } catch (\Exception $e) {
            Log::error('Error al actualizar usuario en BD tenant', [
                'notaria_id' => $notaria->id,
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'error' => 'Ocurrió un error al actualizar el usuario. Por favor intenta nuevamente.',
            ])->withInput();
        }
    }

    /**
     * Eliminar usuario (solo Dashboard Avanzado)
     */
    public function destroy($id)
    {
        $this->checkAdminNotaria();

        $user = Auth::user();
        $notaria = $user->notaria;

        if (! $notaria) {
            abort(403, 'Tu cuenta no está asignada a ninguna notaría.');
        }

        // Verificar si puede eliminar usuarios según el plan
        $subscription = $notaria->subscripcionActiva;
        $plan = $subscription?->plan;

        if (! $this->canDeleteUsers($plan)) {
            return back()->withErrors([
                'plan' => 'Tu plan no permite eliminar usuarios. Contacta a soporte de Atinet o actualiza a Dashboard Avanzado.',
            ]);
        }

        try {
            // Verificar que no sea el único admin
            $adminCount = $this->executeInTenantDatabase($notaria, function ($connection) {
                return DB::connection($connection)
                    ->table('users')
                    ->where('tipo_cuenta', 'admin_notaria')
                    ->count();
            });

            $targetUser = $this->executeInTenantDatabase($notaria, function ($connection) use ($id) {
                return DB::connection($connection)
                    ->table('users')
                    ->where('id', $id)
                    ->first();
            });

            if ($targetUser->tipo_cuenta === 'admin_notaria' && $adminCount <= 1) {
                return back()->withErrors([
                    'admin' => 'No puedes eliminar al único administrador de la notaría.',
                ]);
            }

            // Eliminar usuario
            $this->executeInTenantDatabase($notaria, function ($connection) use ($id) {
                DB::connection($connection)
                    ->table('users')
                    ->where('id', $id)
                    ->delete();
            });

            return redirect()->route('notaria.users.index')
                ->with('success', 'Usuario eliminado exitosamente.');

        } catch (\Exception $e) {
            Log::error('Error al eliminar usuario en BD tenant', [
                'notaria_id' => $notaria->id,
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'error' => 'Ocurrió un error al eliminar el usuario. Por favor intenta nuevamente.',
            ]);
        }
    }

    /**
     * Validar que el usuario autenticado sea admin_notaria
     */
    private function checkAdminNotaria(): void
    {
        if (! Auth::check() || Auth::user()->tipo_cuenta !== 'admin_notaria') {
            abort(403, 'Solo los administradores de notaría pueden gestionar usuarios.');
        }
    }

    /**
     * Ejecutar callback en la BD tenant de la notaría
     */
    private function executeInTenantDatabase(Notaria $notaria, callable $callback)
    {
        // Generar nombre de BD tenant
        $estadoCodigo = EstadoMexico::getCodeFromName($notaria->estado);
        $databaseName = "atinet_{$estadoCodigo}_notaria_{$notaria->numero_notaria}";

        // Configurar conexión temporal
        $connectionName = 'tenant_temp';
        config(["database.connections.{$connectionName}" => [
            'driver' => 'mysql',
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => $databaseName,
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]]);

        try {
            // Ejecutar callback con la conexión temporal
            return $callback($connectionName);
        } finally {
            // Limpiar conexión temporal
            DB::purge($connectionName);
            config(["database.connections.{$connectionName}" => null]);
        }
    }

    /**
     * Verificar si el plan permite eliminar usuarios
     */
    private function canDeleteUsers($plan): bool
    {
        if (! $plan) {
            return false; // Sin plan, no puede eliminar
        }

        // Verificar si tiene el servicio DASHBOARD_AVANZADO
        return $plan->services()
            ->where('code', 'DASHBOARD_AVANZADO')
            ->exists();
    }

    /**
     * Verificar si tiene Dashboard Avanzado
     */
    private function hasDashboardAvanzado($plan): bool
    {
        if (! $plan) {
            return false;
        }

        return $plan->services()
            ->where('code', 'DASHBOARD_AVANZADO')
            ->exists();
    }
}
