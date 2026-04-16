<?php

namespace App\Models;

use App\Models\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchHistory extends Model
{
    /** @use HasFactory<\Database\Factories\SearchHistoryFactory> */
    use BelongsToNotaria, HasFactory;

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

    // notaria() viene del trait BelongsToNotaria

    /**
     * Relación con el usuario que realizó la búsqueda
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope para filtrar por usuario
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
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
