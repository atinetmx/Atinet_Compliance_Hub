<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
                ->whereBetween('fecha_vencimiento', [now(), now()->addDays(2)])
                ->count(),
            'grace_period' => Subscription::where('status', 'vencida')
                ->whereBetween('fecha_vencimiento', [now()->subDays(7), now()])
                ->count(),
            'needs_attention' => Subscription::where('status', 'suspendida')
                ->where('created_at', '<', now()->subDays(30))
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
}
