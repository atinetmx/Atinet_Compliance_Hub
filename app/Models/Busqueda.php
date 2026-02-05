<?php

namespace App\Models;

use App\Models\Scopes\NotariaScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Busqueda extends Model
{
    /** @use HasFactory<\Database\Factories\BusquedaFactory> */
    use HasFactory;

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

    protected static function booted(): void
    {
        static::addGlobalScope(new NotariaScope);
    }

    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
