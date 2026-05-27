<?php

namespace App\Models;

use App\Models\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AgendaEvent extends Model
{
    use BelongsToNotaria;
    use LogsActivity;

    protected $table = 'agenda_events';

    protected $fillable = [
        'notaria_id',
        'user_id',
        'legacy_notaria',
        'titulo',
        'start_fecha',
        'end_fecha',
        'comentarios',
        'color',
        'tipo',
        'rrule',
        'duration',
        'all_day',
    ];

    protected function casts(): array
    {
        return [
            'start_fecha' => 'datetime',
            'end_fecha' => 'datetime',
            'rrule' => 'array',
            'all_day' => 'boolean',
        ];
    }

    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Configuración para el registro de actividad
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['titulo', 'start_fecha', 'end_fecha', 'comentarios', 'tipo', 'color', 'all_day'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('agenda')
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => "Creó evento de agenda: {$this->titulo}",
                'updated' => "Actualizó evento de agenda: {$this->titulo}",
                'deleted' => "Eliminó evento de agenda: {$this->titulo}",
                default => "Modificó evento de agenda: {$this->titulo}",
            });
    }

    /**
     * Scope: eventos visibles para el usuario
     *
     * LÓGICA:
     * - Admin con vista "todos": eventos de usuarios de su notaría + eventos legacy (user_id NULL)
     * - Admin con vista "propio": solo sus eventos + eventos legacy (user_id NULL)
     * - Usuario normal: sus eventos + eventos legacy de su notaría (user_id NULL)
     * - Super admin con vista "todos": todos los eventos de atinet
     * - Super admin con vista "propio": solo sus eventos + eventos legacy
     *
     * @param  string  $vista  'propio' o 'todos' (default: 'todos')
     */
    public function scopeVisiblePara($query, User $user, string $vista = 'todos'): void
    {
        // Si el usuario quiere ver SOLO SU AGENDA (vista "propio")
        if ($vista === 'propio') {
            $query->where(function ($q) use ($user) {
                // Eventos propios
                $q->where('user_id', $user->id)

                // Eventos legacy compartidos (user_id IS NULL)
                    ->orWhere(function ($q2) use ($user) {
                        $q2->whereNull('user_id');

                        // Super admin: eventos legacy de 'atinet' (notaria_id=11 o NULL)
                        if ($user->tipo_cuenta === 'super_admin') {
                            $q2->where(function ($q3) {
                                $q3->where('legacy_notaria', 'atinet')
                                   ->orWhere('notaria_id', 11)
                                   ->orWhereNull('notaria_id');
                            });
                        }
                        // Usuarios de notaría: eventos legacy de su notaría
                        elseif ($user->notaria_id) {
                            $q2->where('notaria_id', $user->notaria_id);
                        }
                    });
            });

            return;
        }

        // Vista "todos" - comportamiento según tipo de usuario
        $query->where(function ($q) use ($user) {
            // Eventos propios
            $q->where('user_id', $user->id)

            // Eventos legacy compartidos (user_id IS NULL)
                ->orWhere(function ($q2) use ($user) {
                    $q2->whereNull('user_id');

                    // Super admin: eventos legacy de 'atinet' (notaria_id=11 o NULL)
                    if ($user->tipo_cuenta === 'super_admin') {
                        $q2->where(function ($q3) {
                            $q3->where('legacy_notaria', 'atinet')
                               ->orWhere('notaria_id', 11)
                               ->orWhereNull('notaria_id');
                        });
                    }
                    // Usuarios de notaría: eventos legacy de su notaría
                    elseif ($user->notaria_id) {
                        $q2->where('notaria_id', $user->notaria_id);
                    }
                });

            // Admin de notaría: también ve eventos de otros usuarios de su notaría
            if ($user->tipo_cuenta === 'admin_notaria' && $user->notaria_id) {
                $q->orWhere(function ($q3) use ($user) {
                    $q3->whereNotNull('user_id')
                        ->where('user_id', '!=', $user->id)
                        ->where('notaria_id', $user->notaria_id);
                });
            }

            // Super admin: también ve eventos de otros super admins (notaria_id=11)
            if ($user->tipo_cuenta === 'super_admin') {
                $q->orWhere(function ($q3) use ($user) {
                    $q3->whereNotNull('user_id')
                        ->where('user_id', '!=', $user->id)
                        ->where(function ($q4) {
                            $q4->where('notaria_id', 11)
                               ->orWhereNull('notaria_id');
                        });
                });
            }
        });
    }

    /**
     * Scope: eventos de una notaría (por ID o por slug legacy)
     */
    public function scopeDeLaNotaria($query, int $notariaId): void
    {
        $query->where('notaria_id', $notariaId);
    }

    /**
     * Formatea el evento para FullCalendar.
     */
    public function toFullCalendar(): array
    {
        $data = [
            'id' => $this->id,
            'title' => $this->titulo,
            'color' => $this->color,
            'allDay' => $this->all_day,
            'extendedProps' => [
                'comentarios' => $this->comentarios,
                'tipo' => $this->tipo,
                'user_id' => $this->user_id,
            ],
        ];

        // Evento recurrente: rrule + duration en lugar de start/end fijos
        if ($this->rrule) {
            $data['rrule'] = array_merge($this->rrule, [
                'dtstart' => $this->start_fecha?->toIso8601String(),
            ]);
            $data['duration'] = $this->duration;
        } else {
            $data['start'] = $this->start_fecha?->toIso8601String();
            $data['end'] = $this->end_fecha?->toIso8601String();
        }

        return $data;
    }
}
