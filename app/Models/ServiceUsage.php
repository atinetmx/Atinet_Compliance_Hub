<?php

namespace App\Models;

use App\Models\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceUsage extends Model
{
    use BelongsToNotaria;

    // Deshabilitar updated_at ya que usamos solo created_at
    const UPDATED_AT = null;

    protected $table = 'service_usage';

    protected $fillable = [
        'tenant_id',
        'service_id',
        'user_id',
        'consumed_at',
        'quantity',
        'cost',
        'billable',
        'billed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'consumed_at' => 'datetime',
            'quantity' => 'integer',
            'cost' => 'decimal:2',
            'billable' => 'boolean',
            'billed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class, 'tenant_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
