<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Busqueda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SearchHistoryController extends Controller
{
    /**
     * GET /admin/search-history
     * Listar búsquedas recientes del usuario/notaría
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $notaria = $user->notaria;

        if (! $notaria) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no asociado a notaría',
            ], 403);
        }

        $query = Busqueda::where('notaria_id', $notaria->id);

        // Filtros opcionales
        if ($request->has('tipo_busqueda') && $request->tipo_busqueda !== '') {
            $query->delTipo($request->tipo_busqueda);
        }

        if ($request->has('dias')) {
            $query->recientes((int) $request->dias);
        }

        if ($request->has('usuario_id')) {
            $query->delUsuario((int) $request->usuario_id);
        }

        if ($request->has('termino') && $request->termino !== '') {
            $query->porTermino($request->termino);
        }

        $busquedas = $query
            ->with(['user:id,name,email', 'notaria:id,nombre'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $busquedas,
        ]);
    }

    /**
     * GET /admin/search-history/{id}
     * Obtener detalles de una búsqueda específica
     */
    public function show($id)
    {
        $busqueda = Busqueda::with(['user', 'notaria'])->findOrFail($id);
        $user = Auth::user();

        // Verificar que pertenece a su notaría o es super_admin
        if ($busqueda->notaria_id !== $user->notaria_id && ! $user->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $busqueda,
        ]);
    }

    /**
     * DELETE /admin/search-history/{id}
     * Eliminar una búsqueda del historial
     */
    public function destroy($id)
    {
        $busqueda = Busqueda::findOrFail($id);
        $user = Auth::user();

        // Solo el autor o super_admin puede eliminar
        if ($busqueda->user_id !== $user->id && ! $user->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $busqueda->delete();

        Log::info('Búsqueda eliminada del historial', [
            'busqueda_id' => $id,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Búsqueda eliminada del historial',
        ]);
    }

    /**
     * POST /admin/search-history/clear-notaria
     * Limpiar todo el historial de la notaría (admin only)
     */
    public function clearNotaria(Request $request)
    {
        $user = Auth::user();
        $notaria = $user->notaria;

        // Solo admins de la notaría
        if (! in_array($user->tipo_cuenta, ['super_admin', 'admin_notaria'])) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $cantidad = Busqueda::where('notaria_id', $notaria->id)->delete();

        Log::info('Historial de búsquedas limpiado', [
            'notaria_id' => $notaria->id,
            'cantidad' => $cantidad,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Se eliminaron {$cantidad} búsquedas del historial",
        ]);
    }

    /**
     * GET /admin/search-history/statistics
     * Estadísticas del historial
     */
    public function statistics()
    {
        $user = Auth::user();
        $notaria = $user->notaria;

        if (! $notaria) {
            return response()->json(['success' => false, 'message' => 'No autorizado'], 403);
        }

        $stats = [
            'total_busquedas' => Busqueda::where('notaria_id', $notaria->id)->count(),
            'busquedas_hoy' => Busqueda::where('notaria_id', $notaria->id)
                ->whereDate('created_at', today())
                ->count(),
            'busquedas_semana' => Busqueda::where('notaria_id', $notaria->id)
                ->recientes(7)
                ->count(),
            'busquedas_mes' => Busqueda::where('notaria_id', $notaria->id)
                ->recientes(30)
                ->count(),
            'por_tipo' => Busqueda::where('notaria_id', $notaria->id)
                ->selectRaw('tipo_busqueda, COUNT(*) as total')
                ->groupBy('tipo_busqueda')
                ->get(),
            'por_usuario' => Busqueda::where('notaria_id', $notaria->id)
                ->with('user:id,name,email')
                ->selectRaw('user_id, COUNT(*) as total')
                ->groupBy('user_id')
                ->get(),
            'tipos_disponibles' => [
                'Persona Física',
                'Persona Moral',
                'RFC',
                'Combinada',
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
