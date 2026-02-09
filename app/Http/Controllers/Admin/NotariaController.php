<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notaria;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotariaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $notarias = Notaria::with(['plan', 'subscripcionActiva'])
            ->withCount('users')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Notarias/Index', [
            'notarias' => $notarias,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $planes = Plan::orderBy('orden')->get();

        return Inertia::render('Admin/Notarias/Create', [
            'planes' => $planes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'numero_notaria' => 'required|string|max:10|unique:notarias',
            'plan_id' => 'required|exists:plans,id',
            'contacto_principal' => 'required|string|max:255',
            'email_contacto' => 'required|email|max:255',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
            'notas_internas' => 'nullable|string',
            'activa' => 'boolean',
            // Configuraciones custom opcionales
            'limite_usuarios_custom' => 'nullable|integer|min:0',
            'limite_busquedas_mes_custom' => 'nullable|integer|min:0',
            'herramientas_activas_custom' => 'nullable|array',
        ]);

        $notaria = Notaria::create(array_merge($validated, [
            'fecha_registro' => now(),
            'total_usuarios' => 0,
            'busquedas_mes_actual' => 0,
            'activa' => $validated['activa'] ?? true,
        ]));

        return redirect()->route('admin.notarias.index')
            ->with('success', 'Notaría creada exitosamente');
    }

    /**
     * Display the specified resource.
     */
    public function show(Notaria $notaria): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $notaria->load(['plan', 'subscripcionActiva', 'users', 'busquedas']);

        return Inertia::render('Admin/Notarias/Show', [
            'notaria' => $notaria,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Notaria $notaria): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $planes = Plan::orderBy('orden')->get();

        return Inertia::render('Admin/Notarias/Edit', [
            'notaria' => $notaria,
            'planes' => $planes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Notaria $notaria)
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'numero_notaria' => 'required|string|max:10|unique:notarias,numero_notaria,' . $notaria->id,
            'plan_id' => 'required|exists:plans,id',
            'contacto_principal' => 'required|string|max:255',
            'email_contacto' => 'required|email|max:255',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
            'notas_internas' => 'nullable|string',
            'activa' => 'boolean',
            // Configuraciones custom opcionales
            'limite_usuarios_custom' => 'nullable|integer|min:0',
            'limite_busquedas_mes_custom' => 'nullable|integer|min:0',
            'herramientas_activas_custom' => 'nullable|array',
        ]);

        $notaria->update($validated);

        return redirect()->route('admin.notarias.index')
            ->with('success', 'Notaría actualizada exitosamente');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Notaria $notaria)
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        // Verificar si tiene usuarios activos
        if ($notaria->users()->count() > 0) {
            return back()->with('error', 'No se puede eliminar una notaría que tiene usuarios activos');
        }

        $notaria->delete();

        return redirect()->route('admin.notarias.index')
            ->with('success', 'Notaría eliminada exitosamente');
    }
}
