<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSubscriptionRequest;
use App\Http\Requests\Admin\UpdateSubscriptionRequest;
use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of subscriptions.
     */
    public function index(Request $request): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $query = Subscription::with(['notaria', 'plan'])
            ->orderBy('created_at', 'desc');

        // Filtro por estado
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtro por plan
        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->plan_id);
        }

        // Filtro: vencen pronto (próximos 7 días)
        if ($request->boolean('expiring_soon')) {
            $query->where('status', 'activa')
                ->whereBetween('fecha_vencimiento', [now(), now()->addDays(7)]);
        }

        // Búsqueda por notaría
        if ($request->filled('search')) {
            $query->whereHas('notaria', function ($q) use ($request) {
                $q->where('nombre', 'like', "%{$request->search}%")
                    ->orWhere('numero_notaria', 'like', "%{$request->search}%");
            });
        }

        $subscriptions = $query->paginate(15)->withQueryString();

        // Estadísticas
        $stats = [
            'total' => Subscription::count(),
            'activas' => Subscription::whereIn('status', ['activa', 'trial'])->count(),
            'trial' => Subscription::where('status', 'trial')->count(),
            'vencidas' => Subscription::where('status', 'vencida')->count(),
            'suspendidas' => Subscription::where('status', 'suspendida')->count(),
            'canceladas' => Subscription::where('status', 'cancelada')->count(),
            'mrr' => Subscription::whereIn('status', ['activa'])->sum('precio_pagado'),
        ];

        // Alertas
        $alerts = [
            'expiring_soon' => Subscription::where('status', 'activa')
                ->whereBetween('fecha_vencimiento', [now(), now()->addDays(7)])
                ->count(),
            'grace_period' => Subscription::where('status', 'vencida')
                ->whereBetween('fecha_vencimiento', [now()->subDays(7), now()])
                ->count(),
            'needs_attention' => Subscription::whereIn('status', ['vencida', 'suspendida'])
                ->count(),
        ];

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $subscriptions,
            'stats' => $stats,
            'alerts' => $alerts,
            'filters' => $request->only(['status', 'plan_id', 'search', 'expiring_soon']),
        ]);
    }

    /**
     * Display the specified subscription.
     */
    public function show(Subscription $subscription): Response
    {
        // Solo super_admin puede acceder
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $subscription->load(['notaria', 'plan']);

        // Calcular días restantes o pasados
        $today = now();
        if ($subscription->fecha_vencimiento > $today) {
            $subscription->dias_restantes = $today->diffInDays($subscription->fecha_vencimiento);
            $subscription->dias_vencido = 0;
        } else {
            $subscription->dias_restantes = 0;
            $subscription->dias_vencido = $subscription->fecha_vencimiento->diffInDays($today);
        }

        // Estado de peligro
        $subscription->en_periodo_gracia = $subscription->status === 'vencida' && $subscription->dias_vencido <= 7;
        $subscription->vence_pronto = $subscription->status === 'activa' && $subscription->dias_restantes <= 7;

        return Inertia::render('Admin/Subscriptions/Show', [
            'subscription' => $subscription,
        ]);
    }

    /**
     * Show the form for creating a new subscription.
     */
    public function create(Request $request): Response
    {
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        // Obtener TODAS las notarías con información de suscripciones activas
        $notarias = Notaria::with(['subscripciones' => function ($query) {
            $query->whereIn('status', ['activa', 'trial'])
                ->with('plan:id,nombre')
                ->select('id', 'notaria_id', 'plan_id', 'status', 'fecha_vencimiento');
        }])
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'numero_notaria'])
            ->map(function ($notaria) {
                $suscripciones = $notaria->subscripciones;
                $suscripcionActiva = $suscripciones->where('status', 'activa')->first();
                $suscripcionesTrial = $suscripciones->where('status', 'trial');

                return [
                    'id' => $notaria->id,
                    'nombre' => $notaria->nombre,
                    'numero_notaria' => $notaria->numero_notaria,
                    'has_active_subscription' => $suscripcionActiva !== null,
                    'has_trial_subscriptions' => $suscripcionesTrial->isNotEmpty(),
                    'active_subscription' => $suscripcionActiva,
                    'trial_subscriptions' => $suscripcionesTrial->values(),
                    'total_subscriptions' => $suscripciones->count(),
                ];
            });

        $plans = Plan::where('is_active', true)
            ->orderBy('orden')
            ->get(['id', 'nombre', 'precio_mensual', 'precio_anual']);

        return Inertia::render('Admin/Subscriptions/Create', [
            'notarias' => $notarias,
            'plans' => $plans,
            'defaultNotariaId' => $request->notaria_id,
        ]);
    }

    /**
     * Store a newly created subscription in storage.
     */
    public function store(StoreSubscriptionRequest $request)
    {
        // Verificar que la notaría no tenga suscripción activa
        $existingActive = Subscription::where('notaria_id', $request->notaria_id)
            ->whereIn('status', ['activa', 'trial'])
            ->exists();

        if ($existingActive) {
            return back()->with('error', 'La notaría ya tiene una suscripción activa.');
        }

        $subscription = Subscription::create($request->validated());

        // Activar/desactivar notaría según el estado de la suscripción
        $notaria = Notaria::find($subscription->notaria_id);
        if ($notaria) {
            $notaria->update([
                'activa' => in_array($subscription->status, ['activa', 'trial']),
            ]);
        }

        return redirect()
            ->route('admin.subscriptions.show', $subscription)
            ->with('success', 'Suscripción creada exitosamente.');
    }

    /**
     * Show the form for editing the specified subscription.
     */
    public function edit(Subscription $subscription): Response
    {
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $subscription->load(['notaria', 'plan']);

        $plans = Plan::where('is_active', true)
            ->orderBy('orden')
            ->get(['id', 'nombre', 'precio_mensual', 'precio_anual']);

        return Inertia::render('Admin/Subscriptions/Edit', [
            'subscription' => $subscription,
            'plans' => $plans,
        ]);
    }

    /**
     * Update the specified subscription in storage.
     */
    public function update(UpdateSubscriptionRequest $request, Subscription $subscription)
    {
        $oldStatus = $subscription->status;
        $subscription->update($request->validated());

        // Si cambió el estado, actualizar estado de la notaría
        if ($oldStatus !== $subscription->status) {
            $notaria = $subscription->notaria;
            if ($notaria) {
                $notaria->update([
                    'activa' => in_array($subscription->status, ['activa', 'trial']),
                ]);
            }
        }

        return redirect()
            ->route('admin.subscriptions.show', $subscription)
            ->with('success', 'Suscripción actualizada exitosamente.');
    }

    /**
     * Change subscription status (activate, suspend, cancel).
     */
    public function changeStatus(Request $request, Subscription $subscription)
    {
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $validated = $request->validate([
            'status' => 'required|in:trial,activa,vencida,suspendida,cancelada',
            'razon_cancelacion' => 'nullable|string|max:500',
        ]);

        $oldStatus = $subscription->status;

        $subscription->status = $validated['status'];

        if ($validated['status'] === 'cancelada') {
            $subscription->fecha_cancelacion = now();
            $subscription->razon_cancelacion = $validated['razon_cancelacion'] ?? null;
        }

        $subscription->save();

        // Actualizar estado de la notaría según el nuevo estado
        $notaria = $subscription->notaria;
        if ($notaria) {
            $notaria->update([
                'activa' => in_array($validated['status'], ['activa', 'trial']),
            ]);
        }

        return back()->with('success', "Suscripción cambiada de {$oldStatus} a {$validated['status']}.");
    }

    /**
     * Renew subscription.
     */
    public function renew(Request $request, Subscription $subscription)
    {
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            abort(403, 'Acceso denegado');
        }

        $validated = $request->validate([
            'duracion_meses' => 'required|integer|min:1|max:24',
            'precio_pagado' => 'nullable|numeric|min:0',
        ]);

        $nuevaFechaVencimiento = now()->addMonths($validated['duracion_meses']);

        $subscription->update([
            'fecha_vencimiento' => $nuevaFechaVencimiento,
            'status' => 'activa',
            'precio_pagado' => $validated['precio_pagado'] ?? $subscription->precio_pagado,
        ]);

        // Reactivar notaría al renovar
        $notaria = $subscription->notaria;
        if ($notaria) {
            $notaria->update(['activa' => true]);
        }

        return back()->with('success', "Suscripción renovada hasta {$nuevaFechaVencimiento->format('d/m/Y')}.");
    }
}
