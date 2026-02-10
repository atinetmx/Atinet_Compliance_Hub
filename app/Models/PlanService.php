<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanService extends Model
{
    protected $fillable = [
        'plan_id',
        'service_id',
        'is_included',
        'usage_limit',
        'extra_price',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'is_included' => 'boolean',
            'usage_limit' => 'integer',
            'extra_price' => 'decimal:2',
            'priority' => 'integer',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
