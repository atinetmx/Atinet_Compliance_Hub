<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchHistory extends Model
{
    /** @use HasFactory<\Database\Factories\SearchHistoryFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'notaria_id',
        'search_term',
        'search_type',
        'results_count',
        'search_params',
    ];

    protected function casts(): array
    {
        return [
            'search_params' => 'array',
            'results_count' => 'integer',
        ];
    }

    /**
     * Relación con el usuario que realizó la búsqueda
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con la notaría
     */
    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    /**
     * Scope para filtrar por usuario
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    /**
     * Scope para filtrar por notaría
     */
    public function scopeForNotaria($query, $notariaId)
    {
        return $query->where('notaria_id', $notariaId);
    }

    /**
     * Scope para filtrar por tipo de búsqueda
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('search_type', $type);
    }

    /**
     * Scope para búsquedas recientes
     */
    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }
}

