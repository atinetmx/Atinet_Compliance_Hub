<?php

namespace App\Http\Controllers;

use App\Models\AgendaEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Agenda/Index');
    }

    /**
     * Devuelve eventos en formato FullCalendar JSON.
     * El rango de fechas lo pasan como query params: start, end
     */
    public function events(Request $request): JsonResponse
    {
        $user = $request->user();
        $notariaId = $user->notaria_id;

        $query = AgendaEvent::where('notaria_id', $notariaId)
            ->visiblePara($user);

        if ($request->filled('start')) {
            $query->where('end_fecha', '>=', $request->input('start'));
        }

        if ($request->filled('end')) {
            $query->where('start_fecha', '<=', $request->input('end'));
        }

        return response()->json(
            $query->get()->map->toFullCalendar()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:145'],
            'start_fecha' => ['required', 'date'],
            'end_fecha' => ['required', 'date', 'after_or_equal:start_fecha'],
            'comentarios' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:10'],
            'tipo' => ['nullable', 'in:general,cita,recordatorio,festivo'],
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
            'end_fecha' => ['sometimes', 'required', 'date', 'after_or_equal:start_fecha'],
            'comentarios' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:10'],
            'tipo' => ['nullable', 'in:general,cita,recordatorio,festivo'],
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

    /**
     * Verifica que el usuario pueda modificar/eliminar el evento.
     * Admin puede cualquier evento de su notaría; usuario solo los propios.
     */
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
