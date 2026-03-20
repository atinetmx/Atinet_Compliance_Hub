<?php

namespace App\Http\Controllers;

use App\Models\AgendaEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Agenda/Index');
    }

    /**
     * Devuelve eventos en formato FullCalendar JSON (incluye recurrentes con rrule).
     */
    public function events(Request $request): JsonResponse
    {
        $user = $request->user();
        $vista = $request->input('vista', 'todos'); // 'propio' o 'todos'

        // El scope visiblePara maneja toda la lógica de visibilidad
        $query = AgendaEvent::visiblePara($user, $vista);

        // Para eventos NO recurrentes filtramos por rango; los recurrentes se incluyen siempre
        if ($request->filled('start') && $request->filled('end')) {
            $query->where(function ($q) use ($request) {
                $q->whereNotNull('rrule')
                    ->orWhere(function ($q2) use ($request) {
                        $q2->whereNull('rrule')
                            ->where('end_fecha', '>=', $request->input('start'))
                            ->where('start_fecha', '<=', $request->input('end'));
                    });
            });
        }

        return response()->json(
            $query->get()->map->toFullCalendar()
        );
    }

    /**
     * Eventos del día seleccionado (vista de lista / Citas del día).
     */
    public function today(Request $request): JsonResponse
    {
        $request->validate(['fecha' => ['nullable', 'date']]);

        $user = $request->user();
        $fecha = $request->input('fecha', now()->toDateString());
        $vista = $request->input('vista', 'todos'); // 'propio' o 'todos'

        $events = AgendaEvent::visiblePara($user, $vista)
            ->whereNull('rrule') // los recurrentes se manejan solo en el calendario
            ->whereDate('start_fecha', '<=', $fecha)
            ->whereDate('end_fecha', '>=', $fecha)
            ->orderBy('start_fecha')
            ->get();

        return response()->json($events->map(fn ($e) => [
            'id' => $e->id,
            'titulo' => $e->titulo,
            'start_fecha' => $e->start_fecha?->format('H:i'),
            'end_fecha' => $e->end_fecha?->format('H:i'),
            'comentarios' => $e->comentarios,
            'color' => $e->color,
            'tipo' => $e->tipo,
            'user_id' => $e->user_id,
        ]));
    }

    /**
     * Bitácora de actividad desde la BD legacy (atinet65_aplicativos.log).
     */
    public function log(Request $request): JsonResponse
    {
        $request->validate([
            'fecha' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'min:10', 'max:500'],
        ]);

        $user = $request->user();
        $fecha = $request->input('fecha', now()->toDateString());
        $limit = $request->integer('limit', 100);

        $esAdmin = in_array($user->tipo_cuenta, ['super_admin', 'admin_notaria']);

        // Super admins sin notaría asignada se mapean a 'atinet' legacy
        if ($user->tipo_cuenta === 'super_admin' && ! $user->notaria_id) {
            $legacySlug = 'atinet';
        } else {
            // Obtenemos el slug legacy de la notaría del usuario
            $legacySlug = DB::table('notarias')
                ->where('id', $user->notaria_id)
                ->value('legacy_identifier');

            if (! $legacySlug) {
                return response()->json([]);
            }
        }

        $query = DB::connection('aplicativos')
            ->table('log')
            ->where('notaria', $legacySlug)
            ->where('fecha', $fecha)
            ->orderBy('hora');

        if (! $esAdmin) {
            $query->where('mail', $user->name);
        }

        return response()->json(
            $query->limit($limit)->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:145'],
            'start_fecha' => ['required', 'date'],
            'end_fecha' => ['nullable', 'date'],
            'comentarios' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:10'],
            'tipo' => ['nullable', 'in:general,cita,recordatorio,festivo'],
            'rrule' => ['nullable', 'array'],
            'duration' => ['nullable', 'string', 'max:10'],
            'all_day' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        $event = AgendaEvent::create([
            ...$validated,
            'notaria_id' => $user->notaria_id,
            'user_id' => $user->id,
            'color' => $validated['color'] ?? '#2563eb',
            'tipo' => $validated['tipo'] ?? 'general',
        ]);

        return response()->json($event->toFullCalendar(), 201);
    }

    public function update(Request $request, AgendaEvent $agendaEvent): JsonResponse
    {
        $this->authorizeEvent($agendaEvent, $request->user());

        $validated = $request->validate([
            'titulo' => ['sometimes', 'required', 'string', 'max:145'],
            'start_fecha' => ['sometimes', 'required', 'date'],
            'end_fecha' => ['sometimes', 'nullable', 'date'],
            'comentarios' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:10'],
            'tipo' => ['nullable', 'in:general,cita,recordatorio,festivo'],
            'rrule' => ['nullable', 'array'],
            'duration' => ['nullable', 'string', 'max:10'],
            'all_day' => ['nullable', 'boolean'],
        ]);

        $agendaEvent->update($validated);

        return response()->json($agendaEvent->fresh()->toFullCalendar());
    }

    public function destroy(Request $request, AgendaEvent $agendaEvent): JsonResponse
    {
        $this->authorizeEvent($agendaEvent, $request->user());

        $agendaEvent->delete();

        return response()->json(null, 204);
    }

    private function authorizeEvent(AgendaEvent $event, \App\Models\User $user): void
    {
        $esAdmin = in_array($user->tipo_cuenta, ['super_admin', 'admin_notaria']);

        abort_if(
            $event->notaria_id !== $user->notaria_id,
            403,
            'No tienes acceso a este evento.'
        );

        abort_if(
            ! $esAdmin && $event->user_id !== $user->id,
            403,
            'Solo puedes modificar tus propios eventos.'
        );
    }
}

