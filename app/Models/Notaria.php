<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notaria extends Model
{
    /** @use HasFactory<\Database\Factories\NotariaFactory> */
    use HasFactory;

    protected $fillable = [
        'nombre',
        'codigo',
        'activa',
    ];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function busquedas(): HasMany
    {
        return $this->hasMany(Busqueda::class);
    }
}
