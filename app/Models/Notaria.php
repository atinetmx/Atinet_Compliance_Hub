<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Notaria extends Model
{
    /** @use HasFactory<\Database\Factories\NotariaFactory> */
    use HasFactory;

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
     * Suscripción activa de la notaría
     */
    public function subscripcionActiva(): HasOne
    {
        return $this->hasOne(Subscription::class)->where('status', Subscription::STATUS_ACTIVA);
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
        return $this->belongsToMany(Service::class, 'tenant_services', 'tenant_id')
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
    public function serviceUsage(): HasMany
    {
        return $this->hasMany(ServiceUsage::class, 'tenant_id');
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
}
