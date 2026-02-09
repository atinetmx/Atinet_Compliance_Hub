<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class NotariaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $notarias = Notaria::with(['plan', 'subscripcionActiva'])
            ->withCount('users')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Notarias/Index', [
            'notarias' => $notarias,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $planes = Plan::orderBy('orden')->get();

        return Inertia::render('Admin/Notarias/Create', [
            'planes' => $planes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'numero_notaria' => 'required|string|max:10|unique:notarias',
            'plan_id' => 'required|exists:plans,id',
            'contacto_principal' => 'required|string|max:255',
            'email_contacto' => 'required|email|max:255',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
            'notas_internas' => 'nullable|string',
            'activa' => 'boolean',
            // Configuraciones custom opcionales
            'limite_usuarios_custom' => 'nullable|integer|min:0',
            'limite_busquedas_mes_custom' => 'nullable|integer|min:0',
            'herramientas_activas_custom' => 'nullable|array',
        ]);

        // Crear la notaría
        $notaria = Notaria::create(array_merge($validated, [
            'fecha_registro' => now(),
            'total_usuarios' => 0,
            'busquedas_mes_actual' => 0,
            'activa' => $validated['activa'] ?? true,
        ]));

        // ✅ 1. CREAR USUARIO ADMINISTRADOR DE LA NOTARÍA
        $tempPassword = 'admin123'; // Contraseña temporal
        $adminUser = User::create([
            'name' => $validated['contacto_principal'],
            'email' => $validated['email_contacto'],
            'password' => Hash::make($tempPassword),
            'recoverable_password' => \Illuminate\Support\Facades\Crypt::encryptString($tempPassword),
            'tipo_cuenta' => 'admin_notaria',
            'notaria_id' => $notaria->id,
            'email_verified_at' => now(),
        ]);

        // ✅ 2. CREAR BASE DE DATOS ESPECÍFICA PARA LA NOTARÍA
        $this->createNotariaDatabase($notaria);

        // ✅ 3. CREAR SUSCRIPCIÓN INICIAL
        $plan = Plan::find($validated['plan_id']);
        Subscription::create([
            'notaria_id' => $notaria->id,
            'plan_id' => $validated['plan_id'],
            'status' => 'trial', // Primer mes de prueba
            'fecha_inicio' => now(),
            'fecha_vencimiento' => now()->addMonth(), // Primer mes gratis
            'precio_pagado' => $plan ? $plan->precio_mensual : 0,
            'moneda' => 'MXN',
            'ciclo_facturacion' => 'mensual',
            'auto_renovacion' => true,
        ]);

        // ✅ 4. ACTUALIZAR CONTADOR DE USUARIOS
        $notaria->increment('total_usuarios');

        return redirect()->route('admin.notarias.index')
            ->with('success', "Notaría creada exitosamente. Usuario admin creado: {$adminUser->email} (contraseña: admin123)");
    }

    /**
     * Display the specified resource.
     */
    public function show(Notaria $notaria): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $notaria->load(['plan', 'subscripcionActiva', 'users', 'busquedas']);

        return Inertia::render('Admin/Notarias/Show', [
            'notaria' => $notaria,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Notaria $notaria): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $planes = Plan::orderBy('orden')->get();

        return Inertia::render('Admin/Notarias/Edit', [
            'notaria' => $notaria,
            'planes' => $planes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Notaria $notaria)
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'numero_notaria' => 'required|string|max:10|unique:notarias,numero_notaria,' . $notaria->id,
            'plan_id' => 'required|exists:plans,id',
            'contacto_principal' => 'required|string|max:255',
            'email_contacto' => 'required|email|max:255',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
            'notas_internas' => 'nullable|string',
            'activa' => 'boolean',
            // Configuraciones custom opcionales
            'limite_usuarios_custom' => 'nullable|integer|min:0',
            'limite_busquedas_mes_custom' => 'nullable|integer|min:0',
            'herramientas_activas_custom' => 'nullable|array',
        ]);

        $notaria->update($validated);

        return redirect()->route('admin.notarias.index')
            ->with('success', 'Notaría actualizada exitosamente');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Notaria $notaria)
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        // Verificar si tiene usuarios activos
        if ($notaria->users()->count() > 0) {
            return back()->with('error', 'No se puede eliminar una notaría que tiene usuarios activos');
        }

        $notaria->delete();

        return redirect()->route('admin.notarias.index')
            ->with('success', 'Notaría eliminada exitosamente');
    }

    /**
     * ✅ MÉTODO PARA CREAR BASE DE DATOS ESPECÍFICA DE NOTARÍA
     * Según la arquitectura híbrida: cada notaría necesita su propia BD local
     * SIN AFECTAR LA SESIÓN ACTUAL DEL SUPER ADMIN
     */
    private function createNotariaDatabase(Notaria $notaria): void
    {
        $databaseName = 'atinet_notaria_' . $notaria->numero_notaria;

        try {
            // ✅ 1. CREAR BASE DE DATOS ESPECÍFICA (SIN CAMBIAR CONEXIÓN ACTUAL)
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            Log::info("Base de datos creada para notaría", [
                'notaria_id' => $notaria->id,
                'numero_notaria' => $notaria->numero_notaria,
                'database_name' => $databaseName,
                'contacto' => $notaria->email_contacto,
            ]);

            // ✅ 2. PREPARAR DATOS INICIALES EN LA BD DEL TENANT
            // Esto se hace en background para no afectar el flujo principal
            $this->seedNotariaDatabase($databaseName, $notaria);

        } catch (\Exception $e) {
            Log::error("Error al crear BD de notaría", [
                'notaria_id' => $notaria->id,
                'error' => $e->getMessage()
            ]);

            // No fallar la creación de la notaría por esto
            // En producción, esto se haría en un job separado
        }
    }

    /**
     * ✅ MÉTODO PARA PREPARAR DATOS INICIALES EN BD DE NOTARÍA
     * Crea las tablas y datos básicos para funcionamiento local
     */
    private function seedNotariaDatabase(string $databaseName, Notaria $notaria): void
    {
        // Configurar conexión temporal a la nueva BD
        config(['database.connections.tenant_temp' => [
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
            // ✅ 1. EJECUTAR TODAS LAS MIGRACIONES EN LA BD DE LA NOTARÍA
            $this->runMigrationsForTenant($databaseName);

            // ✅ 2. CREAR USUARIO ADMIN LOCAL PARA LA NOTARÍA (SIN CAMBIAR SESIÓN ACTUAL)
            $this->createLocalAdminUser($databaseName, $notaria);

            // ✅ 3. COPIAR DATOS ESENCIALES (CONFIGURACIÓN)
            $this->copyEssentialData($databaseName, $notaria);

            Log::info("BD de notaría preparada completamente", [
                'database_name' => $databaseName,
                'notaria_id' => $notaria->id
            ]);

        } catch (\Exception $e) {
            Log::error("Error al preparar BD de notaría", [
                'database_name' => $databaseName,
                'error' => $e->getMessage()
            ]);
        } finally {
            // ✅ LIMPIAR CONEXIÓN TEMPORAL
            config(['database.connections.tenant_temp' => null]);
        }
    }

    /**
     * ✅ EJECUTAR MIGRACIONES BÁSICAS EN BD DEL TENANT
     * TODAS las migraciones para que funcione offline (sistema híbrido)
     */
    private function runMigrationsForTenant(string $databaseName): void
    {
        try {
            // ✅ EJECUTAR TODAS LAS MIGRACIONES EN LA BD DEL TENANT
            // Usamos Artisan para ejecutar las migraciones en la BD específica
            \Illuminate\Support\Facades\Artisan::call('migrate', [
                '--database' => 'tenant_temp',
                '--path' => 'database/migrations',
                '--force' => true, // No preguntar en producción
            ]);

            Log::info("Migraciones ejecutadas en BD del tenant", [
                'database_name' => $databaseName
            ]);

        } catch (\Exception $e) {
            Log::error("Error al ejecutar migraciones del tenant", [
                'database_name' => $databaseName,
                'error' => $e->getMessage()
            ]);

            // Si falla, crear manualmente las tablas mínimas críticas
            $this->createMinimalTables($databaseName);
        }
    }

    /**
     * ✅ CREAR TABLAS MÍNIMAS SI FALLAN LAS MIGRACIONES
     */
    private function createMinimalTables(string $databaseName): void
    {
        $minimalTables = [
            "USE `{$databaseName}`",

            // Usuarios (crítico)
            "CREATE TABLE IF NOT EXISTS `users` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `name` varchar(255) NOT NULL,
                `email` varchar(255) NOT NULL,
                `email_verified_at` timestamp NULL,
                `password` varchar(255) NOT NULL,
                `tipo_cuenta` enum('admin_notaria','usuario_notaria','invitado') NOT NULL DEFAULT 'usuario_notaria',
                `notaria_id` bigint unsigned DEFAULT NULL,
                `two_factor_secret` text,
                `two_factor_recovery_codes` text,
                `two_factor_confirmed_at` timestamp NULL,
                `remember_token` varchar(100) DEFAULT NULL,
                `current_team_id` bigint unsigned DEFAULT NULL,
                `profile_photo_path` varchar(2048) DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT NULL,
                `updated_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `users_email_unique` (`email`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            // Configuración local
            "CREATE TABLE IF NOT EXISTS `configuracion` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `clave` varchar(255) NOT NULL,
                `valor` text,
                `descripcion` varchar(255) DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT NULL,
                `updated_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `configuracion_clave_unique` (`clave`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        ];

        foreach ($minimalTables as $sql) {
            try {
                DB::statement($sql);
            } catch (\Exception $e) {
                Log::error("Error creando tabla mínima", [
                    'sql' => $sql,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * ✅ CREAR USUARIO ADMIN LOCAL EN BD DEL TENANT (SIN AFECTAR SESIÓN ACTUAL)
     */
    private function createLocalAdminUser(string $databaseName, Notaria $notaria): void
    {
        try {
            // Usar SQL directo para no afectar la sesión del super admin
            $sql = "INSERT INTO `{$databaseName}`.`users`
                    (`name`, `email`, `password`, `tipo_cuenta`, `notaria_id`, `email_verified_at`, `created_at`, `updated_at`)
                    VALUES (?, ?, ?, 'admin_notaria', NULL, NOW(), NOW(), NOW())";

            DB::statement($sql, [
                $notaria->contacto_principal,
                $notaria->email_contacto,
                Hash::make('admin123')
            ]);

            Log::info("Usuario admin local creado en BD del tenant", [
                'database_name' => $databaseName,
                'email' => $notaria->email_contacto
            ]);

        } catch (\Exception $e) {
            Log::error("Error creando usuario admin local", [
                'database_name' => $databaseName,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * ✅ COPIAR DATOS ESENCIALES A BD DEL TENANT
     */
    private function copyEssentialData(string $databaseName, Notaria $notaria): void
    {
        // Insertar configuración básica
        $configs = [
            ['notaria_nombre', $notaria->nombre, 'Nombre de la notaría'],
            ['notaria_numero', $notaria->numero_notaria, 'Número de notaría'],
            ['modo_operacion', 'local', 'Modo de operación (local/online)'],
            ['ultima_sincronizacion', now()->toDateTimeString(), 'Última sincronización con central']
        ];

        foreach ($configs as [$clave, $valor, $descripcion]) {
            $sql = "INSERT INTO `{$databaseName}`.`configuracion`
                    (`clave`, `valor`, `descripcion`, `created_at`, `updated_at`)
                    VALUES (?, ?, ?, NOW(), NOW())";
            DB::statement($sql, [$clave, $valor, $descripcion]);
        }
    }
}
