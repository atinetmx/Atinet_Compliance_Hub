<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notaria;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::withoutGlobalScopes()
            ->with(['notaria' => function ($query) {
                $query->select('id', 'nombre', 'numero_notaria');
            }]);

        // Filtros
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tipo_cuenta')) {
            $query->where('tipo_cuenta', $request->input('tipo_cuenta'));
        }

        if ($request->filled('notaria_id')) {
            $query->where('notaria_id', $request->input('notaria_id'));
        }

        $users = $query->paginate(15)->withQueryString();

        $notarias = Notaria::select('id', 'nombre', 'numero_notaria')
            ->orderBy('numero_notaria')
            ->get();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'notarias' => $notarias,
            'filters' => $request->only(['search', 'tipo_cuenta', 'notaria_id']),
            'tiposCuenta' => [
                'super_admin' => 'Super Administrador',
                'admin_notaria' => 'Admin Notaría',
                'usuario_notaria' => 'Usuario Notaría',
                'invitado' => 'Invitado',
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $notarias = Notaria::select('id', 'nombre', 'numero_notaria')
            ->orderBy('numero_notaria')
            ->get();

        return Inertia::render('Admin/Users/Create', [
            'notarias' => $notarias,
            'tiposCuenta' => [
                'super_admin' => 'Super Administrador',
                'admin_notaria' => 'Admin Notaría',
                'usuario_notaria' => 'Usuario Notaría',
                'invitado' => 'Invitado',
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'tipo_cuenta' => 'required|in:super_admin,admin_notaria,usuario_notaria,invitado',
            'notaria_id' => 'nullable|exists:notarias,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'plain_password' => $validated['password'],
            'tipo_cuenta' => $validated['tipo_cuenta'],
            'notaria_id' => $validated['notaria_id'],
            'email_verified_at' => now(),
        ]);

        return redirect()->route('admin.users.index')
            ->with('success', 'Usuario creado exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        $user->load(['notaria', 'busquedas' => function ($query) {
            $query->latest()->take(10);
        }]);

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'stats' => [
                'total_busquedas' => $user->busquedas()->count(),
                'busquedas_mes' => $user->busquedas()
                    ->whereMonth('created_at', now()->month)
                    ->count(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        $notarias = Notaria::select('id', 'nombre', 'numero_notaria')
            ->orderBy('numero_notaria')
            ->get();

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'notarias' => $notarias,
            'tiposCuenta' => [
                'super_admin' => 'Super Administrador',
                'admin_notaria' => 'Admin Notaría',
                'usuario_notaria' => 'Usuario Notaría',
                'invitado' => 'Invitado',
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'tipo_cuenta' => 'required|in:super_admin,admin_notaria,usuario_notaria,invitado',
            'notaria_id' => 'nullable|exists:notarias,id',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'tipo_cuenta' => $validated['tipo_cuenta'],
            'notaria_id' => $validated['notaria_id'],
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
            $updateData['plain_password'] = $validated['password'];
        }

        $user->update($updateData);

        return redirect()->route('admin.users.index')
            ->with('success', 'Usuario actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // No permitir eliminar super_admin
        if ($user->tipo_cuenta === 'super_admin') {
            return back()->withErrors(['error' => 'No se puede eliminar un Super Administrador.']);
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'Usuario eliminado exitosamente.');
    }

    /**
     * Mostrar reportes de usuarios
     */
    public function reports()
    {
        $stats = [
            'total_usuarios' => User::withoutGlobalScopes()->count(),
            'por_tipo_cuenta' => User::withoutGlobalScopes()
                ->selectRaw('tipo_cuenta, COUNT(*) as total')
                ->groupBy('tipo_cuenta')
                ->pluck('total', 'tipo_cuenta'),
            'por_notaria' => User::withoutGlobalScopes()
                ->with('notaria:id,nombre,numero_notaria')
                ->whereNotNull('notaria_id')
                ->get()
                ->groupBy('notaria.nombre')
                ->map(function ($users) {
                    return $users->count();
                }),
            'usuarios_activos' => User::withoutGlobalScopes()
                ->whereNotNull('email_verified_at')
                ->count(),
            'registros_recientes' => User::withoutGlobalScopes()
                ->where('created_at', '>=', now()->subDays(30))
                ->count(),
        ];

        return Inertia::render('Admin/Users/Reports', [
            'stats' => $stats,
        ]);
    }
}
