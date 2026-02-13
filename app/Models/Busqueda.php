<?php

namespace App\Models;

use App\Models\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Busqueda extends Model
{
    /** @use HasFactory<\Database\Factories\BusquedaFactory> */
    use BelongsToNotaria, HasFactory;

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
        return ! empty($this->resultados['data'] ?? $this->resultados);
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
