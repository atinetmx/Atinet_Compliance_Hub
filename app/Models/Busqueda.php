<?php

namespace App\Models;

use App\Models\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Busqueda extends Model
{
    /** @use HasFactory<\Database\Factories\BusquedaFactory> */
    use BelongsToNotaria, HasFactory, LogsActivity;

    protected $fillable = [
        'notaria_id',
        'user_id',
        'tipo_busqueda',
        'termino_busqueda',
        'resultados',
    ];

    protected $casts = [
        'resultados' => 'array',
    ];

    // La relación notaria() viene del trait BelongsToNotaria

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Configuración para el registro de actividad
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['tipo_busqueda', 'termino_busqueda', 'resultados'])
            ->dontSubmitEmptyLogs()
            ->useLogName('listas_negras')
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => "Realizó búsqueda {$this->tipo_busqueda}: {$this->termino_busqueda}",
                'updated' => "Actualizó búsqueda: {$this->termino_busqueda}",
                'deleted' => "Eliminó búsqueda: {$this->termino_busqueda}",
                default => "Modificó búsqueda: {$this->termino_busqueda}",
            });
    }

    /**
     * Scope: Filtrar por últimos N días
     */
    public function scopeRecientes($query, int $dias = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($dias));
    }

    /**
     * Scope: Filtrar por usuario
     */
    public function scopeDelUsuario($query, int $usuario_id)
    {
        return $query->where('user_id', $usuario_id);
    }

    /**
     * Scope: Filtrar por tipo de búsqueda
     */
    public function scopeDelTipo($query, string $tipo)
    {
        return $query->where('tipo_busqueda', $tipo);
    }

    /**
     * Scope: Filtrar por notaría
     */
    public function scopeDeLaNotaria($query, int $notaria_id)
    {
        return $query->where('notaria_id', $notaria_id);
    }

    /**
     * Scope: Buscar por término
     */
    public function scopePorTermino($query, string $termino)
    {
        return $query->where('termino_busqueda', 'like', '%'.$termino.'%');
    }

    /**
     * Verificar si la búsqueda tiene resultados
     */
    public function tieneResultados(): bool
    {
        $data = $this->resultados['data'] ?? $this->resultados;

        if (isset($this->resultados['total'])) {
            return $this->resultados['total'] > 0;
        }

        return ! empty($data);
    }

    /**
     * Obtener cantidad de resultados
     */
    public function cantidadResultados(): int
    {
        if (isset($this->resultados['total'])) {
            return $this->resultados['total'];
        }

        $data = $this->resultados['data'] ?? $this->resultados;

        return count($data ?? []);
    }

    /**
     * Obtener solo resultados OFAC
     */
    public function getResultadosOfac(): array
    {
        return $this->resultados['data']['ofac'] ?? [];
    }

    /**
     * Obtener solo resultados SAT
     */
    public function getResultadosSat(): array
    {
        return $this->resultados['data']['sat'] ?? [];
    }
}
