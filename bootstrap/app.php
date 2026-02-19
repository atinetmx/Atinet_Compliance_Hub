<?php

use App\Http\Middleware\CheckServiceAccess;
use App\Http\Middleware\CheckSubscriptionStatus;
use App\Http\Middleware\EnsureAdminNotaria;
use App\Http\Middleware\EnsureInvitado;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureTenantAccess;
use App\Http\Middleware\EnsureUsuarioNotaria;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'tenant' => EnsureTenantAccess::class,
            'ensure.super.admin' => EnsureSuperAdmin::class,
            'ensure.admin.notaria' => EnsureAdminNotaria::class,
            'ensure.usuario.notaria' => EnsureUsuarioNotaria::class,
            'ensure.invitado' => EnsureInvitado::class,
            'service' => CheckServiceAccess::class,
            'subscription' => CheckSubscriptionStatus::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
