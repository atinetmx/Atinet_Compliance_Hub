<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== DIAGNÓSTICO DE CSRF Y SESIÓN ===\n\n";

// Verificar configuración de sesión
echo "📋 Configuración de Sesión:\n";
echo "   Driver: " . config('session.driver') . "\n";
echo "   Lifetime: " . config('session.lifetime') . " minutos\n";
echo "   Expire on close: " . (config('session.expire_on_close') ? 'Sí' : 'No') . "\n";
echo "   Encrypt: " . (config('session.encrypt') ? 'Sí' : 'No') . "\n";
echo "   Cookie name: " . config('session.cookie') . "\n";
echo "   Same site: " . config('session.same_site') . "\n\n";

// Verificar tabla de sesiones
if (config('session.driver') === 'database') {
    try {
        $sessionsCount = \DB::table('sessions')->count();
        echo "✅ Tabla 'sessions' existe: $sessionsCount sesiones activas\n";
        
        // Mostrar sesiones recientes
        $recentSessions = \DB::table('sessions')
            ->orderBy('last_activity', 'desc')
            ->limit(5)
            ->get(['id', 'user_id', 'last_activity']);
        
        echo "\n📊 Sesiones recientes:\n";
        foreach ($recentSessions as $session) {
            $userId = $session->user_id ?? 'guest';
            $time = date('Y-m-d H:i:s', $session->last_activity);
            $id = substr($session->id, 0, 8) . '...';
            echo "   • $id | User: $userId | Última actividad: $time\n";
        }
    } catch (\Exception $e) {
        echo "❌ Error al acceder a tabla sessions: " . $e->getMessage() . "\n";
    }
}

echo "\n";

// Verificar middleware CSRF
echo "🔐 Middleware CSRF:\n";
$excludedRoutes = config('sanctum.stateful', []);
echo "   Dominios permitidos (stateful): " . implode(', ', $excludedRoutes) . "\n\n";

// Verificar rutas de búsqueda
echo "🔍 Rutas de Búsqueda:\n";
try {
    $routes = \Illuminate\Support\Facades\Route::getRoutes();
    $searchRoutes = collect($routes)->filter(function ($route) {
        return str_contains($route->uri(), 'search');
    });
    
    foreach ($searchRoutes as $route) {
        $methods = implode('|', $route->methods());
        $middleware = implode(', ', $route->middleware());
        echo "   $methods {$route->uri()}\n";
        echo "      Middleware: $middleware\n";
    }
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Verificar usuario de prueba
echo "👤 Usuario de Prueba (leinad@notaria1.com):\n";
$user = \App\Models\User::where('email', 'leinad@notaria1.com')->first();
if ($user) {
    echo "   ✅ Existe\n";
    echo "   ID: {$user->id}\n";
    echo "   Tipo: {$user->tipo_cuenta}\n";
    echo "   Notaría ID: {$user->notaria_id}\n";
    
    if ($user->notaria) {
        $subscription = $user->notaria->subscripcionActiva;
        if ($subscription) {
            echo "   ✅ Tiene suscripción {$subscription->status}\n";
        } else {
            echo "   ❌ Sin suscripción activa\n";
        }
    }
} else {
    echo "   ❌ No encontrado\n";
}

echo "\n";
echo "💡 Soluciones sugeridas:\n";
echo "   1. Recarga la página con Ctrl+Shift+R (forzar sin caché)\n";
echo "   2. Cierra sesión y vuelve a iniciar sesión\n";
echo "   3. Limpia las cookies del navegador para localhost:8000\n";
echo "   4. Verifica que el servidor esté corriendo en http://127.0.0.1:8000\n";
