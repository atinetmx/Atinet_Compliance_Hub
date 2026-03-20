<?php

namespace App\Http\Controllers;

use App\Models\SearchHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SearchHistoryController extends Controller
{
    /**
     * Mostrar vista completa de historial
     */
    public function index(): Response
    {
        return Inertia::render('Admin/ListasNegras/History');
    }

    /**
     * Obtener historial con filtros y paginación
     */
    public function list(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = SearchHistory::with(['user', 'notaria'])
            ->where('user_id', $user->id);

        // Filtros
        if ($request->filled('search_type')) {
            $query->where('search_type', $request->search_type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('has_results')) {
            if ($request->has_results === 'yes') {
                $query->where('results_count', '>', 0);
            } elseif ($request->has_results === 'no') {
                $query->where('results_count', 0);
            }
        }

        // Ordenar
        $orderBy = $request->get('order_by', 'created_at');
        $orderDir = $request->get('order_dir', 'desc');
        $query->orderBy($orderBy, $orderDir);

        // Paginación
        $perPage = $request->get('per_page', 15);
        $histories = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $histories,
        ]);
    }

    /**
     * Obtener búsquedas recientes (últimas 10)
     */
    public function recent(Request $request): JsonResponse
    {
        $user = $request->user();

        $histories = SearchHistory::forUser($user)
            ->recent(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $histories,
        ]);
    }

    /**
     * Obtener estadísticas del historial
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalBusquedas = SearchHistory::forUser($user)->count();

        $busquedasEsteMes = SearchHistory::forUser($user)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $busquedasEstaSemana = SearchHistory::forUser($user)
            ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();

        $busquedasHoy = SearchHistory::forUser($user)
            ->whereDate('created_at', now())
            ->count();

        $promedioResultados = SearchHistory::forUser($user)
            ->avg('results_count');

        // Tipo más usado
        $tipoMasUsado = SearchHistory::forUser($user)
            ->select('search_type', DB::raw('count(*) as total'))
            ->groupBy('search_type')
            ->orderByDesc('total')
            ->first();

        // Distribución por tipo
        $porTipo = SearchHistory::forUser($user)
            ->select('search_type as tipo_busqueda', DB::raw('count(*) as total'))
            ->groupBy('search_type')
            ->get();

        // Distribución por notaría y tipo (para scatter chart)
        $porNotariaYTipo = SearchHistory::with('notaria')
            ->where('user_id', $user->id)
            ->select('notaria_id', 'search_type as tipo_busqueda', DB::raw('count(*) as total'))
            ->groupBy('notaria_id', 'search_type')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_busquedas' => $totalBusquedas,
                'busquedas_este_mes' => $busquedasEsteMes,
                'busquedas_esta_semana' => $busquedasEstaSemana,
                'busquedas_hoy' => $busquedasHoy,
                'promedio_resultados' => round($promedioResultados ?? 0, 1),
                'tipo_mas_usado' => $tipoMasUsado?->search_type ?? 'N/A',
                'por_tipo' => $porTipo,
                'por_notaria_y_tipo' => $porNotariaYTipo,
            ],
        ]);
    }

    /**
     * Guardar búsqueda en historial
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search_term' => 'required|string|max:255',
            'search_type' => 'required|string|in:Persona Física,Persona Moral,RFC,Búsqueda Combinada',
            'results_count' => 'required|integer|min:0',
            'search_params' => 'nullable|array',
        ]);

        $user = $request->user();

        $history = SearchHistory::create([
            'user_id' => $user->id,
            'notaria_id' => $user->notaria_id,
            'search_term' => $validated['search_term'],
            'search_type' => $validated['search_type'],
            'results_count' => $validated['results_count'],
            'search_params' => $validated['search_params'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Búsqueda guardada en historial',
            'data' => $history,
        ], 201);
    }

    /**
     * Eliminar búsqueda del historial
     */
    public function destroy(Request $request, SearchHistory $searchHistory): JsonResponse
    {
        // Verificar que la búsqueda pertenece al usuario
        if ($searchHistory->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para eliminar esta búsqueda',
            ], 403);
        }

        $searchHistory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Búsqueda eliminada del historial',
        ]);
    }

    /**
     * Limpiar todo el historial del usuario
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user();

        $deleted = SearchHistory::forUser($user)->delete();

        return response()->json([
            'success' => true,
            'message' => "Se eliminaron {$deleted} búsquedas del historial",
        ]);
    }
}

