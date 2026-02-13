<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🧹 Limpiando asociación innecesaria de SuperAdmin con notaría...\n\n";

$user = App\Models\User::first();

if ($user->notaria_id) {
    echo "   Usuario tenía notaría asociada: ID {$user->notaria_id}\n";
    $user->notaria_id = null;
    $user->save();
    echo "   ✅ Asociación removida\n\n";
} else {
    echo "   ✅ Usuario ya está sin notaría asociada\n\n";
}

echo "✅ SuperAdmin configurado correctamente\n";
echo "   - Email: {$user->email}\n";
echo "   - Tipo: {$user->tipo_cuenta}\n";
echo "   - Notaría: " . ($user->notaria_id ?? 'NINGUNA (correcto para SuperAdmin)') . "\n";
