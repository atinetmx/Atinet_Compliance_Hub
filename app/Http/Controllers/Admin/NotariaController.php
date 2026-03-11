<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EstadoMexico;
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
use Illuminate\Validation\Rule;
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
            'numero_notaria' => [
                'required',
                'string',
                'max:10',
                Rule::unique('notarias')
                    ->where('estado', $request->estado)
                    ->where('municipio', $request->municipio),
            ],
            'legacy_identifier' => 'nullable|string|max:100',
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
            // Campos de ubicación normalizados
            'estado' => 'nullable|string|in:'.implode(',', EstadoMexico::toArray()),
            'municipio' => 'nullable|string|max:100',
            'codigo_postal' => 'nullable|regex:/^\d{5}$/',
            'colonia' => 'nullable|string|max:100',
            'calle' => 'nullable|string|max:255',
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
            'numero_notaria' => [
                'required',
                'string',
                'max:10',
                Rule::unique('notarias')
                    ->where('estado', $request->estado)
                    ->where('municipio', $request->municipio)
                    ->ignore($notaria->id),
            ],
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
            // Campos de ubicación normalizados
            'estado' => 'nullable|string|in:'.implode(',', EstadoMexico::toArray()),
            'municipio' => 'nullable|string|max:100',
            'codigo_postal' => 'nullable|regex:/^\d{5}$/',
            'colonia' => 'nullable|string|max:100',
            'calle' => 'nullable|string|max:255',
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
     *
     * Formato del nombre: atinet_{estado}_notaria_{numero}
     * Ejemplos:
     *   - atinet_bcs_notaria_21      (Baja California Sur, Notaría 21)
     *   - atinet_edomex_notaria_1    (Estado de México, Notaría 1)
     *   - atinet_jal_notaria_15      (Jalisco, Notaría 15)
     *   - atinet_default_notaria_99  (Sin estado definido)
     */
    private function createNotariaDatabase(Notaria $notaria): void
    {
        // Obtener código del estado (ej: "Baja California Sur" => "bcs")
        $estadoCodigo = EstadoMexico::getCodeFromName($notaria->estado);

        // Generar nombre de BD: atinet_{estado}_notaria_{numero}
        $databaseName = "atinet_{$estadoCodigo}_notaria_{$notaria->numero_notaria}";

        try {
            // ✅ 1. CREAR BASE DE DATOS ESPECÍFICA (SIN CAMBIAR CONEXIÓN ACTUAL)
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            Log::info('Base de datos creada para notaría', [
                'notaria_id' => $notaria->id,
                'numero_notaria' => $notaria->numero_notaria,
                'estado' => $notaria->estado,
                'estado_codigo' => $estadoCodigo,
                'database_name' => $databaseName,
                'contacto' => $notaria->email_contacto,
            ]);

            // ✅ 2. PREPARAR DATOS INICIALES EN LA BD DEL TENANT
            // Esto se hace en background para no afectar el flujo principal
            $this->seedNotariaDatabase($databaseName, $notaria);

        } catch (\Exception $e) {
            Log::error('Error al crear BD de notaría', [
                'notaria_id' => $notaria->id,
                'error' => $e->getMessage(),
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

            Log::info('BD de notaría preparada completamente', [
                'database_name' => $databaseName,
                'notaria_id' => $notaria->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Error al preparar BD de notaría', [
                'database_name' => $databaseName,
                'error' => $e->getMessage(),
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

            Log::info('Migraciones ejecutadas en BD del tenant', [
                'database_name' => $databaseName,
            ]);

        } catch (\Exception $e) {
            Log::error('Error al ejecutar migraciones del tenant', [
                'database_name' => $databaseName,
                'error' => $e->getMessage(),
            ]);

            // Si falla, crear manualmente las tablas mínimas críticas
            $this->createMinimalTables($databaseName);
        }
    }

    /**
     * ✅ CREAR TABLAS MÍNIMAS SI FALLAN LAS MIGRACIONES
     * Incluye tablas críticas del sistema de servicios
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
            'CREATE TABLE IF NOT EXISTS `configuracion` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `clave` varchar(255) NOT NULL,
                `valor` text,
                `descripcion` varchar(255) DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT NULL,
                `updated_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `configuracion_clave_unique` (`clave`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',

            // Servicios (nuevo - crítico para Fase 1.5)
            'CREATE TABLE IF NOT EXISTS `services` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `code` varchar(50) NOT NULL,
                `name` varchar(255) NOT NULL,
                `description` text,
                `category` varchar(50) NOT NULL,
                `billing_model` varchar(50) NOT NULL,
                `unit_price` decimal(10,2) DEFAULT NULL,
                `is_active` tinyint(1) NOT NULL DEFAULT 1,
                `metadata` json DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT NULL,
                `updated_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `services_code_unique` (`code`),
                KEY `services_category_index` (`category`),
                KEY `services_is_active_index` (`is_active`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',

            // Plan Services (relación plan-servicio con límites)
            'CREATE TABLE IF NOT EXISTS `plan_services` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `plan_id` bigint unsigned NOT NULL,
                `service_id` bigint unsigned NOT NULL,
                `is_included` tinyint(1) NOT NULL DEFAULT 1,
                `usage_limit` int DEFAULT NULL,
                `extra_price` decimal(10,2) DEFAULT NULL,
                `priority` int NOT NULL DEFAULT 999,
                `created_at` timestamp NULL DEFAULT NULL,
                `updated_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `plan_services_plan_id_service_id_unique` (`plan_id`,`service_id`),
                KEY `plan_services_plan_id_index` (`plan_id`),
                KEY `plan_services_service_id_index` (`service_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',

            // Tenant Services (customizaciones por notaría)
            'CREATE TABLE IF NOT EXISTS `tenant_services` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `notaria_id` bigint unsigned NOT NULL,
                `service_id` bigint unsigned NOT NULL,
                `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
                `custom_limit` int DEFAULT NULL,
                `custom_price` decimal(10,2) DEFAULT NULL,
                `activation_date` date DEFAULT NULL,
                `expiration_date` date DEFAULT NULL,
                `notes` text,
                `created_at` timestamp NULL DEFAULT NULL,
                `updated_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `tenant_services_notaria_id_service_id_unique` (`notaria_id`,`service_id`),
                KEY `tenant_services_notaria_id_index` (`notaria_id`),
                KEY `tenant_services_service_id_index` (`service_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',

            // Service Usage (tracking de consumo)
            'CREATE TABLE IF NOT EXISTS `service_usage` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `notaria_id` bigint unsigned NOT NULL,
                `service_id` bigint unsigned NOT NULL,
                `user_id` bigint unsigned NOT NULL,
                `consumed_at` timestamp NOT NULL,
                `quantity` int NOT NULL DEFAULT 1,
                `cost` decimal(10,2) DEFAULT NULL,
                `billable` tinyint(1) NOT NULL DEFAULT 1,
                `billed_at` timestamp NULL DEFAULT NULL,
                `metadata` json DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                KEY `service_usage_notaria_id_index` (`notaria_id`),
                KEY `service_usage_consumed_at_index` (`consumed_at`),
                KEY `service_usage_billable_index` (`billable`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
        ];

        foreach ($minimalTables as $sql) {
            try {
                DB::statement($sql);
            } catch (\Exception $e) {
                Log::error('Error creando tabla mínima', [
                    'database_name' => $databaseName,
                    'sql' => substr($sql, 0, 100).'...',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Tablas mínimas creadas en BD del tenant', [
            'database_name' => $databaseName,
            'tables_count' => count($minimalTables) - 1, // -1 por el USE
        ]);
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
                Hash::make('admin123'),
            ]);

            Log::info('Usuario admin local creado en BD del tenant', [
                'database_name' => $databaseName,
                'email' => $notaria->email_contacto,
            ]);

        } catch (\Exception $e) {
            Log::error('Error creando usuario admin local', [
                'database_name' => $databaseName,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * ✅ COPIAR DATOS ESENCIALES A BD DEL TENANT
     * Incluye: configuración, servicios activos, y configuración del plan
     */
    private function copyEssentialData(string $databaseName, Notaria $notaria): void
    {
        // ✅ 1. INSERTAR CONFIGURACIÓN BÁSICA
        $configs = [
            ['notaria_nombre', $notaria->nombre, 'Nombre de la notaría'],
            ['notaria_numero', $notaria->numero_notaria, 'Número de notaría'],
            ['modo_operacion', 'local', 'Modo de operación (local/online)'],
            ['ultima_sincronizacion', now()->toDateTimeString(), 'Última sincronización con central'],
        ];

        foreach ($configs as [$clave, $valor, $descripcion]) {
            $sql = "INSERT INTO `{$databaseName}`.`configuracion`
                    (`clave`, `valor`, `descripcion`, `created_at`, `updated_at`)
                    VALUES (?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`), `updated_at` = NOW()";
            try {
                DB::statement($sql, [$clave, $valor, $descripcion]);
            } catch (\Exception $e) {
                Log::warning('Error insertando configuración en tenant', [
                    'clave' => $clave,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // ✅ 2. COPIAR EL PLAN CONTRATADO
        // El tenant necesita el plan para validar límites offline
        try {
            $plan = DB::table('plans')->find($notaria->plan_id);

            if ($plan) {
                $sql = "INSERT INTO `{$databaseName}`.`plans`
                        (`id`, `nombre`, `slug`, `descripcion`, `precio_mensual`, `precio_anual`,
                         `limite_usuarios`, `limite_busquedas_mes`, `herramientas_activas`,
                         `caracteristicas`, `is_active`, `orden`, `created_at`, `updated_at`)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            `nombre` = VALUES(`nombre`),
                            `descripcion` = VALUES(`descripcion`),
                            `precio_mensual` = VALUES(`precio_mensual`),
                            `updated_at` = VALUES(`updated_at`)";

                DB::statement($sql, [
                    $plan->id,
                    $plan->nombre,
                    $plan->slug,
                    $plan->descripcion,
                    $plan->precio_mensual,
                    $plan->precio_anual,
                    $plan->limite_usuarios,
                    $plan->limite_busquedas_mes,
                    $plan->herramientas_activas,
                    $plan->caracteristicas,
                    $plan->is_active,
                    $plan->orden,
                    $plan->created_at,
                    $plan->updated_at,
                ]);

                Log::info('Plan copiado a BD del tenant', [
                    'database_name' => $databaseName,
                    'plan_id' => $plan->id,
                    'plan_nombre' => $plan->nombre,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error copiando plan al tenant', [
                'database_name' => $databaseName,
                'error' => $e->getMessage(),
            ]);
        }

        // ✅ 3. COPIAR CATÁLOGO DE SERVICIOS ACTIVOS
        // Solo servicios activos para que el tenant tenga la información disponible
        try {
            $services = DB::table('services')
                ->where('is_active', true)
                ->get();

            foreach ($services as $service) {
                $sql = "INSERT INTO `{$databaseName}`.`services`
                        (`id`, `code`, `name`, `description`, `category`, `billing_model`, `unit_price`, `is_active`, `metadata`, `created_at`, `updated_at`)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            `name` = VALUES(`name`),
                            `description` = VALUES(`description`),
                            `unit_price` = VALUES(`unit_price`),
                            `updated_at` = VALUES(`updated_at`)";

                DB::statement($sql, [
                    $service->id,
                    $service->code,
                    $service->name,
                    $service->description,
                    $service->category,
                    $service->billing_model,
                    $service->unit_price,
                    $service->is_active,
                    $service->metadata,
                    $service->created_at,
                    $service->updated_at,
                ]);
            }

            Log::info('Servicios copiados a BD del tenant', [
                'database_name' => $databaseName,
                'services_count' => $services->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error copiando servicios al tenant', [
                'database_name' => $databaseName,
                'error' => $e->getMessage(),
            ]);
        }

        // ✅ 4. COPIAR CONFIGURACIÓN DEL PLAN (plan_services)
        // Solo los servicios del plan que contrató esta notaría
        try {
            $planServices = DB::table('plan_services')
                ->where('plan_id', $notaria->plan_id)
                ->get();

            foreach ($planServices as $planService) {
                $sql = "INSERT INTO `{$databaseName}`.`plan_services`
                        (`id`, `plan_id`, `service_id`, `is_included`, `usage_limit`, `extra_price`, `priority`, `created_at`, `updated_at`)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            `is_included` = VALUES(`is_included`),
                            `usage_limit` = VALUES(`usage_limit`),
                            `extra_price` = VALUES(`extra_price`),
                            `priority` = VALUES(`priority`),
                            `updated_at` = VALUES(`updated_at`)";

                DB::statement($sql, [
                    $planService->id,
                    $planService->plan_id,
                    $planService->service_id,
                    $planService->is_included,
                    $planService->usage_limit,
                    $planService->extra_price,
                    $planService->priority,
                    $planService->created_at,
                    $planService->updated_at,
                ]);
            }

            Log::info('Configuración del plan copiada a BD del tenant', [
                'database_name' => $databaseName,
                'plan_id' => $notaria->plan_id,
                'plan_services_count' => $planServices->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error copiando plan_services al tenant', [
                'database_name' => $databaseName,
                'error' => $e->getMessage(),
            ]);
        }

        // ✅ 5. COPIAR CUSTOMIZACIONES SI EXISTEN (tenant_services)
        // Si hay customizaciones en la BD central para esta notaría, copiarlas
        try {
            $tenantServices = DB::table('tenant_services')
                ->where('notaria_id', $notaria->id)
                ->get();

            if ($tenantServices->count() > 0) {
                foreach ($tenantServices as $tenantService) {
                    $sql = "INSERT INTO `{$databaseName}`.`tenant_services`
                            (`id`, `notaria_id`, `service_id`, `is_enabled`, `custom_limit`, `custom_price`, `activation_date`, `expiration_date`, `notes`, `created_at`, `updated_at`)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                                `is_enabled` = VALUES(`is_enabled`),
                                `custom_limit` = VALUES(`custom_limit`),
                                `custom_price` = VALUES(`custom_price`),
                                `updated_at` = VALUES(`updated_at`)";

                    DB::statement($sql, [
                        $tenantService->id,
                        $tenantService->notaria_id,
                        $tenantService->service_id,
                        $tenantService->is_enabled,
                        $tenantService->custom_limit,
                        $tenantService->custom_price,
                        $tenantService->activation_date,
                        $tenantService->expiration_date,
                        $tenantService->notes,
                        $tenantService->created_at,
                        $tenantService->updated_at,
                    ]);
                }

                Log::info('Customizaciones copiadas a BD del tenant', [
                    'database_name' => $databaseName,
                    'customizations_count' => $tenantServices->count(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error copiando tenant_services al tenant', [
                'database_name' => $databaseName,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Datos esenciales copiados completamente a BD del tenant', [
            'database_name' => $databaseName,
            'notaria_id' => $notaria->id,
        ]);
    }
}
