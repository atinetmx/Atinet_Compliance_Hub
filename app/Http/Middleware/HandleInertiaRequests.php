<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $servicios = [];

        // Cargar servicios disponibles para admin_notaria
        if ($user && $user->tipo_cuenta === 'admin_notaria' && $user->notaria_id) {
            $notaria = $user->notaria()
                ->with(['subscripcionActiva.plan.services'])
                ->first();

            if ($notaria?->subscripcionActiva?->plan?->services) {
                $servicios = $notaria->subscripcionActiva->plan->services->map(function ($service) {
                    return [
                        'code' => $service->code,
                        'name' => $service->name,
                        'is_included' => $service->pivot->is_included ?? true,
                    ];
                })->filter(function ($service) {
                    return $service['is_included'];
                })->values()->toArray();
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            // Proxy path local: el frontend llama /cn-api/... y Laravel reenvía a C# internamente.
            // Nunca exponer api.base_url al browser (hostname interno no resolvible).
            'apiBaseUrl' => config('api.proxy_path', '/cn-api'),
            'auth' => [
                'user' => $user,
                'servicios' => $servicios,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
