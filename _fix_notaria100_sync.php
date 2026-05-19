<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Notaría #100
$notaria100 = App\Models\Notaria::where('numero_notaria', '100')->first();
if (! $notaria100) {
    echo 'Notaría #100 no encontrada'.PHP_EOL;
    exit;
}
echo "Notaría #100: id={$notaria100->id}, db={$notaria100->tenantDatabaseName()}".PHP_EOL;

$adminUser100 = App\Models\User::where('notaria_id', $notaria100->id)->where('tipo_cuenta', 'admin_notaria')->first();
if ($adminUser100) {
    echo "Admin: {$adminUser100->name} | cn_usuario_id: ".($adminUser100->cn_usuario_id ?? 'NULL').PHP_EOL;

    if (! $adminUser100->cn_usuario_id) {
        echo 'Ejecutando sync...'.PHP_EOL;
        app(App\Observers\UserObserver::class)->created($adminUser100);
        $adminUser100->refresh();
        echo 'cn_usuario_id después: '.($adminUser100->cn_usuario_id ?? 'NULL').PHP_EOL;
    } else {
        echo 'Ya sincronizado ✅'.PHP_EOL;
    }
} else {
    echo 'No se encontró admin para notaría #100'.PHP_EOL;
}
