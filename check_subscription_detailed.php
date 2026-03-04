<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

$notaria = Notaria::find(1);

echo '=== ANÁLISIS DE SUSCRIPCIÓN ==='.PHP_EOL.PHP_EOL;

$subscription = Subscription::where('notaria_id', $notaria->id)->first();

if ($subscription) {
    echo '✅ Suscripción encontrada:'.PHP_EOL;
    echo "  ID: {$subscription->id}".PHP_EOL;
    echo "  Status: {$subscription->status}".PHP_EOL;
    echo "  Plan ID: {$subscription->plan_id}".PHP_EOL;
    echo '  Fecha inicio: '.($subscription->start_date ?? 'NULL').PHP_EOL;
    echo '  Fecha fin: '.($subscription->end_date ?? 'NULL').PHP_EOL;
    echo PHP_EOL;

    // Verificar método estaActiva()
    echo '=== VALIDACIÓN ==='.PHP_EOL;
    echo '  estaActiva(): '.($subscription->estaActiva() ? 'Sí ✅' : 'No ❌').PHP_EOL;

    // Verificar por qué no está activa
    if (! $subscription->estaActiva()) {
        echo PHP_EOL.'⚠️  Razón de inactividad:'.PHP_EOL;

        if ($subscription->status === 'trial') {
            echo "  - Status es 'trial' (debería permitir acceso)".PHP_EOL;

            if (! $subscription->end_date) {
                echo '  - ❌ end_date es NULL (debe tener fecha)'.PHP_EOL;
            } else {
                $now = now();
                $endDate = \Carbon\Carbon::parse($subscription->end_date);

                if ($endDate < $now) {
                    echo "  - ❌ end_date ya pasó ({$subscription->end_date})".PHP_EOL;
                    echo "  - Fecha actual: {$now}".PHP_EOL;
                } else {
                    echo "  - ✅ end_date aún no ha pasado ({$subscription->end_date})".PHP_EOL;
                }
            }
        }
    }

    // Verificar activeSubscription en Notaria
    echo PHP_EOL.'=== ACTIVE SUBSCRIPTION ==='.PHP_EOL;
    $activeSub = $notaria->activeSubscription;
    if ($activeSub) {
        echo "  ✅ activeSubscription encontrada (ID: {$activeSub->id})".PHP_EOL;
    } else {
        echo '  ❌ activeSubscription es NULL'.PHP_EOL;

        // Verificar qué busca activeSubscription
        echo PHP_EOL.'  Buscando en subscripciones con estados permitidos:'.PHP_EOL;
        $allowedStatuses = [
            Subscription::STATUS_ACTIVA,
            Subscription::STATUS_TRIAL,
            Subscription::STATUS_VENCIDA,
        ];

        foreach ($allowedStatuses as $status) {
            $count = DB::table('subscriptions')
                ->where('notaria_id', $notaria->id)
                ->where('status', $status)
                ->count();
            echo "    - {$status}: {$count}".PHP_EOL;
        }
    }

} else {
    echo '❌ No se encontró suscripción'.PHP_EOL;
}

echo PHP_EOL;
