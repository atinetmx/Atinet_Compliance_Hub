<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, LogsActivity, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'notaria_id',
        'tipo_cuenta',
        'recoverable_password',
        'cn_usuario_id',
        'cn_rol_id',
        'cn_password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'recoverable_password',
        'cn_password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    public function busquedas(): HasMany
    {
        return $this->hasMany(Busqueda::class);
    }

    /**
     * Configuración para el registro de actividad
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'tipo_cuenta', 'notaria_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('usuarios')
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => "Creó usuario: {$this->name} ({$this->tipo_cuenta})",
                'updated' => "Actualizó usuario: {$this->name}",
                'deleted' => "Eliminó usuario: {$this->name}",
                default => "Modificó usuario: {$this->name}",
            });
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return $this->tipo_cuenta === $role;
    }

    /**
     * Check if user is super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->tipo_cuenta === 'super_admin';
    }
}
