<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    /** @use HasFactory<\Database\Factories\PlanFactory> */
    use HasFactory;

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'precio_mensual',
        'precio_anual',
        'limite_usuarios',
        'limite_busquedas_mes',
        'herramientas_activas',
        'caracteristicas',
        'is_active',
        'orden',
    ];

    protected $casts = [
        'precio_mensual' => 'decimal:2',
        'precio_anual' => 'decimal:2',
        'herramientas_activas' => 'array',
        'caracteristicas' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Notarías suscritas a este plan
     */
    public function notarias(): HasMany
    {
        return $this->hasMany(Notaria::class);
    }

    /**
     * Suscripciones activas de este plan
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Servicios asignados a este plan
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'plan_services')
            ->withPivot([
                'is_included',
                'usage_limit',
                'extra_price',
                'priority',
            ])
            ->withTimestamps()
            ->orderBy('priority');
    }

    /**
     * Scope para planes activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Verificar si el plan incluye una herramienta específica
     */
    public function incluyeHerramienta(string $herramienta): bool
    {
        return in_array($herramienta, $this->herramientas_activas ?? []);
    }

    /**
     * Obtener precio con descuento anual (si aplica)
     */
    public function getPrecioConDescuentoAttribute(): float
    {
        if ($this->precio_anual && $this->precio_mensual) {
            return $this->precio_anual;
        }

        return $this->precio_mensual * 12;
    }
}
