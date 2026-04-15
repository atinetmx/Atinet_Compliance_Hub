<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Notaria extends Model
{
    /** @use HasFactory<\Database\Factories\NotariaFactory> */
    use HasFactory, LogsActivity;

    protected $fillable = [
        'nombre',
        'numero_notaria',
        'plan_id',
        'limite_usuarios_custom',
        'limite_busquedas_mes_custom',
        'herramientas_activas_custom',
        'total_usuarios',
        'busquedas_mes_actual',
        'activa',
        'fecha_registro',
        'contacto_principal',
        'email_contacto',
        'telefono',
        'direccion',
        'notas_internas',
        // Campos de ubicación normalizados
        'estado',
        'municipio',
        'codigo_postal',
        'colonia',
        'calle',
        // Integración sistema legacy
        'legacy_identifier',
        'legacy_busquedas_count',
        'legacy_ultima_busqueda',
    ];

    protected $casts = [
        'activa' => 'boolean',
        'fecha_registro' => 'date',
        'herramientas_activas_custom' => 'array',
        'total_usuarios' => 'integer',
        'busquedas_mes_actual' => 'integer',
        'limite_usuarios_custom' => 'integer',
        'limite_busquedas_mes_custom' => 'integer',
    ];

    protected $appends = [
        'direccion_completa',
    ];

    /**
     * Accessor: Genera dirección completa formateada
     */
    public function getDireccionCompletaAttribute(): string
    {
        // Si hay campos normalizados, usarlos
        if ($this->calle || $this->estado) {
            $partes = array_filter([
                $this->calle,
                $this->colonia,
                $this->municipio,
                $this->estado,
                $this->codigo_postal ? "C.P. {$this->codigo_postal}" : null,
            ]);

            return implode(', ', $partes);
        }

        // Fallback al campo direccion antiguo si existe
        return $this->direccion ?? 'No especificada';
    }

    /**
     * Configuración para el registro de actividad
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombre', 'numero_notaria', 'plan_id', 'activa', 'email_contacto', 'telefono'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('notarias')
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => "Creó notaría: {$this->nombre} (#{$this->numero_notaria})",
                'updated' => "Actualizó notaría: {$this->nombre}",
                'deleted' => "Eliminó notaría: {$this->nombre}",
                default => "Modificó notaría: {$this->nombre}",
            });
    }

    /**
     * Scope: Buscar notarías por estado
     */
    public function scopePorEstado($query, string $estado)
    {
        return $query->where('estado', $estado);
    }

    /**
     * Scope: Buscar notarías en una región (múltiples estados)
     */
    public function scopePorRegion($query, array $estados)
    {
        return $query->whereIn('estado', $estados);
    }

    /**
     * Plan de suscripción de la notaría
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Suscripción activa de la notaría (incluye trial y vencida en periodo de gracia)
     */
    public function subscripcionActiva(): HasOne
    {
        return $this->hasOne(Subscription::class)
            ->whereIn('status', [
                Subscription::STATUS_ACTIVA,
                Subscription::STATUS_TRIAL,
                Subscription::STATUS_VENCIDA, // Periodo de gracia
            ])
            ->where('fecha_vencimiento', '>=', now()->subDays(7)); // 7 días de gracia
    }

    /**
     * Todas las suscripciones de la notaría
     */
    public function subscripciones(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Usuarios de la notaría
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Búsquedas realizadas en la notaría
     */
    public function busquedas(): HasMany
    {
        return $this->hasMany(Busqueda::class);
    }

    /**
     * Servicios asignados a esta notaría
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'tenant_services', 'notaria_id')
            ->withPivot([
                'is_enabled',
                'custom_limit',
                'custom_price',
                'activation_date',
                'expiration_date',
                'notes',
            ])
            ->withTimestamps();
    }

    /**
     * Registro de uso de servicios
     */
    public function serviceUsages(): HasMany
    {
        return $this->hasMany(ServiceUsage::class, 'notaria_id');
    }

    /**
     * Alias de serviceUsages() para compatibilidad con API .NET de Control Notarial
     * (mantiene convención singular usada por módulos externos)
     */
    public function serviceUsage(): HasMany
    {
        return $this->serviceUsages();
    }

    /**
     * Scope para notarías activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }

    /**
     * Obtener límite de usuarios (custom o del plan)
     */
    public function getLimiteUsuariosAttribute(): int
    {
        return $this->limite_usuarios_custom ?? $this->plan?->limite_usuarios ?? 0;
    }

    /**
     * Obtener límite de búsquedas mensuales (custom o del plan)
     */
    public function getLimiteBusquedasMesAttribute(): int
    {
        return $this->limite_busquedas_mes_custom ?? $this->plan?->limite_busquedas_mes ?? 0;
    }

    /**
     * Obtener herramientas activas (custom o del plan)
     */
    public function getHerramientasActivasAttribute(): array
    {
        return $this->herramientas_activas_custom ?? $this->plan?->herramientas_activas ?? [];
    }

    /**
     * Verificar si puede agregar más usuarios
     */
    public function puedeAgregarUsuarios(int $cantidad = 1): bool
    {
        $limite = $this->limite_usuarios;
        if ($limite === -1) {
            return true;
        } // Ilimitado

        return ($this->total_usuarios + $cantidad) <= $limite;
    }

    /**
     * Verificar si puede hacer más búsquedas este mes
     */
    public function puedeHacerBusquedas(int $cantidad = 1): bool
    {
        $limite = $this->limite_busquedas_mes;
        if ($limite === -1) {
            return true;
        } // Ilimitado

        return ($this->busquedas_mes_actual + $cantidad) <= $limite;
    }

    /**
     * Verificar si tiene acceso a una herramienta específica
     */
    public function tieneAccesoHerramienta(string $herramienta): bool
    {
        return in_array($herramienta, $this->herramientas_activas);
    }

    /**
     * Incrementar contador de búsquedas del mes
     */
    public function incrementarBusquedasMes(int $cantidad = 1): void
    {
        $this->increment('busquedas_mes_actual', $cantidad);
    }

    /**
     * Resetear contador de búsquedas mensuales
     */
    public function resetearBusquedasMes(): void
    {
        $this->update(['busquedas_mes_actual' => 0]);
    }

    /**
     * Obtener todas las suscripciones activas y trial
     */
    public function suscripcionesActivas()
    {
        return $this->subscripciones()
            ->whereIn('status', ['activa', 'trial'])
            ->where('fecha_vencimiento', '>=', now());
    }

    /**
     * Obtener TODOS los servicios disponibles (combinación de todas las suscripciones activas + trial)
     * REGLA: Unión (OR) de servicios de todas las suscripciones
     * FILTRO: Solo servicios IMPLEMENTADOS y ACTIVOS
     */
    public function getAllAvailableServices()
    {
        $suscripciones = $this->suscripcionesActivas()->with('plan.services')->get();

        if ($suscripciones->isEmpty()) {
            return collect();
        }

        // Combinar servicios de todas las suscripciones (sin duplicar)
        $servicios = collect();

        foreach ($suscripciones as $subscription) {
            if ($subscription->plan && $subscription->plan->services) {
                $servicios = $servicios->merge($subscription->plan->services);
            }
        }

        // Eliminar duplicados por ID y FILTRAR solo implementados y activos
        return $servicios->unique('id')
            ->filter(fn ($service) => $service->implementation_status === 'implemented' && $service->is_active);
    }

    /**
     * Verificar si tiene acceso a un servicio específico
     * Busca en TODAS las suscripciones activas (activa + trial)
     */
    public function tieneAccesoServicio(string $serviceCode): bool
    {
        $servicios = $this->getAllAvailableServices();

        return $servicios->contains('code', $serviceCode);
    }

    /**
     * Obtener límites de la suscripción PRINCIPAL (solo 'activa')
     * REGLA: Los límites se toman SOLO de la suscripción 'activa', no de las 'trial'
     */
    public function getLimitesFromMainSubscription(): array
    {
        $suscripcionPrincipal = $this->subscripciones()
            ->where('status', 'activa')
            ->where('fecha_vencimiento', '>=', now())
            ->with('plan')
            ->first();

        if (! $suscripcionPrincipal || ! $suscripcionPrincipal->plan) {
            return [
                'limite_usuarios' => 0,
                'limite_busquedas_mes' => 0,
            ];
        }

        return [
            'limite_usuarios' => $suscripcionPrincipal->plan->limite_usuarios,
            'limite_busquedas_mes' => $suscripcionPrincipal->plan->limite_busquedas_mes,
        ];
    }

    /**
     * Obtener servicios agrupados por categoría para el dashboard
     * Solo servicios IMPLEMENTADOS y ACTIVOS
     */
    public function getServiciosPorCategoria(): array
    {
        $servicios = $this->getAllAvailableServices();

        return $servicios->groupBy('category')
            ->map(fn ($group) => $group->values())
            ->toArray();
    }

    /**
     * Obtener límite de uso para un servicio específico
     * Combina límite del plan + overrides de tenant_services
     */
    public function getLimiteServicio(string $serviceCode): ?int
    {
        // 1. Verificar si existe override en tenant_services
        $tenantService = $this->services()
            ->where('code', $serviceCode)
            ->first();

        if ($tenantService && $tenantService->pivot->custom_limit !== null) {
            return $tenantService->pivot->custom_limit;
        }

        // 2. Obtener del plan en la suscripción activa
        $suscripcion = $this->subscripcionActiva;
        if (! $suscripcion || ! $suscripcion->plan) {
            return null;
        }

        $planService = $suscripcion->plan->services()
            ->where('code', $serviceCode)
            ->first();

        return $planService?->pivot->usage_limit;
    }

    /**
     * Obtener uso actual de un servicio en el mes
     */
    public function getUsoServicioMesActual(string $serviceCode): int
    {
        return $this->serviceUsages()
            ->whereHas('service', fn ($q) => $q->where('code', $serviceCode))
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();
    }

    /**
     * Verificar si puede usar un servicio (no ha excedido límite)
     */
    public function puedeUsarServicio(string $serviceCode): bool
    {
        // 1. Verificar si tiene acceso al servicio
        if (! $this->tieneAccesoServicio($serviceCode)) {
            return false;
        }

        // 2. Obtener límite
        $limite = $this->getLimiteServicio($serviceCode);

        // 3. Si es ilimitado (null), siempre puede usar
        if ($limite === null) {
            return true;
        }

        // 4. Verificar uso actual vs límite
        $usoActual = $this->getUsoServicioMesActual($serviceCode);

        return $usoActual < $limite;
    }
}
