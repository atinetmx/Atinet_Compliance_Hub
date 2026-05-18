<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class InertiaMiddleware extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            // Proxy path local: el frontend llama /cn-api/... y Laravel reenvía a C# internamente.
            // Nunca exponer api.base_url al browser (hostname interno no resolvible).
            'apiBaseUrl' => config('api.proxy_path', '/cn-api'),
        ]);
    }
}
