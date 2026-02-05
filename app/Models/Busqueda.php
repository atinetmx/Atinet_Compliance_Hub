<?php

namespace App\Models;

use App\Models\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Busqueda extends Model
{
    /** @use HasFactory<\Database\Factories\BusquedaFactory> */
    use HasFactory, BelongsToNotaria;

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
}
