<?php

namespace App\Models;

use App\BillingModel;
use App\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'billing_model',
        'unit_price',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'category' => ServiceCategory::class,
            'billing_model' => BillingModel::class,
            'unit_price' => 'decimal:2',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    /**
     * Relación con planes
     */
    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'plan_services')
            ->withPivot([
                'is_included',
                'usage_limit',
                'extra_price',
                'priority',
            ])
            ->withTimestamps();
    }

    /**
     * Relación con notarías (tenants)
     */
    public function notarias(): BelongsToMany
    {
        return $this->belongsToMany(Notaria::class, 'tenant_services', 'service_id', 'tenant_id')
            ->withPivot([
                'is_enabled',
                'custom_limit',
                'custom_price',
                'activation_date',
                'expiration_date',
                'notes',
            ])
            ->withTimestamps();
    }

    /**
     * Relación con registros de uso
     */
    public function usage(): HasMany
    {
        return $this->hasMany(ServiceUsage::class);
    }
}
