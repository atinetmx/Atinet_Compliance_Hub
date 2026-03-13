<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendaEvent extends Model
{
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
    ];

    protected function casts(): array
    {
        return [
            'start_fecha' => 'datetime',
            'end_fecha' => 'datetime',
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
     * Scope: eventos visibles para el usuario (admin ve todos, usuario ve propios)
     */
    public function scopeVisiblePara($query, User $user): void
    {
        $esAdmin = in_array($user->tipo_cuenta, ['super_admin', 'admin_notaria']);

        if (! $esAdmin) {
            $query->where('user_id', $user->id);
        }
    }

    /**
     * Scope: eventos de una notaría (por ID o por slug legacy)
     */
    public function scopeDeLaNotaria($query, int $notariaId): void
    {
        $query->where('notaria_id', $notariaId);
    }

    /**
     * Formatea el evento para FullCalendar
     *
     * @return array{id: int, title: string, start: string, end: string, color: string, extendedProps: array{comentarios: string|null, tipo: string}}
     */
    public function toFullCalendar(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->titulo,
            'start' => $this->start_fecha?->toIso8601String(),
            'end' => $this->end_fecha?->toIso8601String(),
            'color' => $this->color,
            'extendedProps' => [
                'comentarios' => $this->comentarios,
                'tipo' => $this->tipo,
                'user_id' => $this->user_id,
            ],
        ];
    }
}
