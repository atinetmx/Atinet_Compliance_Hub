<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Subscription extends Model
{
    /** @use HasFactory<\Database\Factories\SubscriptionFactory> */
    use HasFactory, LogsActivity;

    protected $fillable = [
        'notaria_id',
        'plan_id',
        'fecha_inicio',
        'fecha_vencimiento',
        'status',
        'metodo_pago',
        'precio_pagado',
        'moneda',
        'ciclo_facturacion', // mensual, anual
        'auto_renovacion',
        'fecha_cancelacion',
        'razon_cancelacion',
        'notas',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_vencimiento' => 'date',
        'fecha_cancelacion' => 'datetime',
        'precio_pagado' => 'decimal:2',
        'auto_renovacion' => 'boolean',
    ];

    /**
     * Estados de suscripción
     */
    public const STATUS_ACTIVA = 'activa';

    public const STATUS_VENCIDA = 'vencida';

    public const STATUS_CANCELADA = 'cancelada';

    public const STATUS_SUSPENDIDA = 'suspendida';

    public const STATUS_TRIAL = 'trial';

    /**
     * Ciclos de facturación
     */
    public const CICLO_MENSUAL = 'mensual';

    public const CICLO_ANUAL = 'anual';

    /**
     * Notaría que tiene esta suscripción
     */
    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    /**
     * Plan de la suscripción
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Configuración para el registro de actividad
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'plan_id', 'fecha_vencimiento', 'auto_renovacion', 'ciclo_facturacion'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('suscripciones')
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => 'Creó suscripción'.($this->plan ? " al plan {$this->plan->nombre}" : ''),
                'updated' => "Actualizó suscripción (estado: {$this->status})",
                'deleted' => 'Canceló suscripción'.($this->plan ? " del plan {$this->plan->nombre}" : ''),
                default => 'Modificó suscripción',
            });
    }

    /**
     * Scope para suscripciones activas (incluye trial)
     */
    public function scopeActivas($query)
    {
        return $query->whereIn('status', [self::STATUS_ACTIVA, self::STATUS_TRIAL])
            ->where('fecha_vencimiento', '>', now());
    }

    /**
     * Scope para suscripciones que vencen pronto
     */
    public function scopeVencenPronto($query, int $dias = 7)
    {
        return $query->where('status', self::STATUS_ACTIVA)
            ->whereBetween('fecha_vencimiento', [now(), now()->addDays($dias)]);
    }

    /**
     * Verificar si la suscripción está activa (incluye trial)
     * Estados válidos: trial, activa
     * Vencida solo si aún no pasa la fecha de vencimiento (periodo de gracia)
     */
    public function estaActiva(): bool
    {
        // Trial y Activa están completamente operativas
        if (in_array($this->status, [self::STATUS_ACTIVA, self::STATUS_TRIAL])) {
            return $this->fecha_vencimiento > now();
        }

        // Vencida tiene periodo de gracia (ej: 7 días después de vencimiento)
        if ($this->status === self::STATUS_VENCIDA) {
            $periodoGracia = 7; // días

            return now()->lessThanOrEqualTo($this->fecha_vencimiento->addDays($periodoGracia));
        }

        return false;
    }

    /**
     * Verificar si la suscripción vence pronto
     */
    public function vencePronto(int $dias = 7): bool
    {
        return $this->estaActiva() &&
               $this->fecha_vencimiento <= now()->addDays($dias);
    }

    /**
     * Renovar suscripción
     */
    public function renovar(): bool
    {
        if (! $this->estaActiva()) {
            return false;
        }

        $meses = $this->ciclo_facturacion === self::CICLO_ANUAL ? 12 : 1;

        $this->update([
            'fecha_vencimiento' => $this->fecha_vencimiento->addMonths($meses),
            'status' => self::STATUS_ACTIVA,
        ]);

        return true;
    }

    /**
     * Cancelar suscripción
     */
    public function cancelar(?string $razon = null): bool
    {
        return $this->update([
            'status' => self::STATUS_CANCELADA,
            'fecha_cancelacion' => now(),
            'razon_cancelacion' => $razon,
            'auto_renovacion' => false,
        ]);
    }
}
