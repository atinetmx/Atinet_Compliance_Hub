<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use App\Models\Subscription;

$notaria = Notaria::find(1);

echo '=== CORRIGIENDO SUSCRIPCIÓN TRIAL ==='.PHP_EOL.PHP_EOL;

$subscription = Subscription::where('notaria_id', $notaria->id)->first();

if ($subscription) {
    echo 'Suscripción actual:'.PHP_EOL;
    echo "  Status: {$subscription->status}".PHP_EOL;
    echo '  Fecha inicio: '.($subscription->start_date ?? 'NULL').PHP_EOL;
    echo '  Fecha fin: '.($subscription->end_date ?? 'NULL').PHP_EOL;
    echo PHP_EOL;

    // Configurar fechas para trial (30 días de prueba)
    $startDate = now();
    $endDate = now()->addDays(30);

    $subscription->update([
        'start_date' => $startDate,
        'end_date' => $endDate,
        'status' => 'trial',
    ]);

    echo '✅ Suscripción actualizada:'.PHP_EOL;
    echo "  Status: {$subscription->status}".PHP_EOL;
    echo "  Fecha inicio: {$subscription->start_date}".PHP_EOL;
    echo "  Fecha fin: {$subscription->end_date}".PHP_EOL;
    echo '  Días restantes: '.now()->diffInDays($subscription->end_date).PHP_EOL;
    echo PHP_EOL;

    // Verificar activeSubscription ahora
    $notaria = $notaria->fresh();
    $activeSub = $notaria->subscripcionActiva;

    if ($activeSub) {
        echo '✅ activeSubscription ahora funciona correctamente'.PHP_EOL;
    } else {
        echo '❌ activeSubscription aún es NULL'.PHP_EOL;
    }

} else {
    echo '❌ No se encontró suscripción'.PHP_EOL;
}

echo PHP_EOL.'=== RESUMEN ==='.PHP_EOL;
echo 'La suscripción trial ahora tiene:'.PHP_EOL;
echo '  - 30 días de acceso completo'.PHP_EOL;
echo '  - Estado: trial (permite acceso total)'.PHP_EOL;
echo "  - Vence: {$endDate->format('Y-m-d')}".PHP_EOL;
echo PHP_EOL;
echo 'Puedes acceder con:'.PHP_EOL;
echo '  Email: leinad@notaria1.com'.PHP_EOL;
echo '  Password: admin123'.PHP_EOL;
echo '  URL: http://192.168.1.1:8080'.PHP_EOL;
