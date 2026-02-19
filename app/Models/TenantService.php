<?php

namespace App\Models;

use App\Models\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantService extends Model
{
    use BelongsToNotaria;

    protected $fillable = [
        'notaria_id',
        'service_id',
        'is_enabled',
        'custom_limit',
        'custom_price',
        'activation_date',
        'expiration_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'custom_limit' => 'integer',
            'custom_price' => 'decimal:2',
            'activation_date' => 'date',
            'expiration_date' => 'date',
        ];
    }

    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class, 'notaria_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
