<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

$notaria = Notaria::find(1);

echo "=== SUSCRIPCIONES DE NOTARÍA #{$notaria->id} ===".PHP_EOL.PHP_EOL;

$subscriptions = Subscription::where('notaria_id', $notaria->id)->get();

if ($subscriptions->count() > 0) {
    foreach ($subscriptions as $sub) {
        echo '- Plan: '.$sub->plan->name.PHP_EOL;
        echo '  Status: '.$sub->status.PHP_EOL;
        echo '  Inicio: '.$sub->start_date.PHP_EOL;
        echo '  Fin: '.$sub->end_date.PHP_EOL;
        echo '  Activa: '.($sub->is_active ? 'Sí' : 'No').PHP_EOL;
        echo PHP_EOL;
    }
} else {
    echo '❌ No tiene suscripciones'.PHP_EOL.PHP_EOL;

    echo '=== PLANES DISPONIBLES ==='.PHP_EOL;
    $plans = Plan::all();
    foreach ($plans as $plan) {
        echo "- {$plan->name} (\${$plan->price}/{$plan->billing_cycle->value})".PHP_EOL;
    }
}

// Verificar contraseña del usuario
echo PHP_EOL.'=== VERIFICAR USUARIO ==='.PHP_EOL;
$user = DB::connection('temp_tenant')->table('users')->where('email', 'leinad@notaria1.com')->first();
if ($user) {
    echo '✅ Usuario existe en BD tenant'.PHP_EOL;
    echo 'Password hash: '.substr($user->password, 0, 20).'...'.PHP_EOL;

    // Probar password común
    if (password_verify('password', $user->password)) {
        echo "✅ Password es: 'password'".PHP_EOL;
    } elseif (password_verify('password123', $user->password)) {
        echo "✅ Password es: 'password123'".PHP_EOL;
    } else {
        echo "⚠️  Password desconocido (no es 'password' ni 'password123')".PHP_EOL;
    }
}
