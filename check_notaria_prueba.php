<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use Illuminate\Support\Facades\DB;

echo '=== BUSCANDO NOTARÍA DE PRUEBA ==='.PHP_EOL.PHP_EOL;

$notaria = Notaria::where('nombre', 'LIKE', '%prueba%')->first();

if ($notaria) {
    echo '✅ NOTARÍA ENCONTRADA:'.PHP_EOL;
    echo '  ID: '.$notaria->id.PHP_EOL;
    echo '  Nombre: '.$notaria->nombre.PHP_EOL;
    echo '  Número: '.$notaria->numero_notaria.PHP_EOL;
    echo '  Estado: '.$notaria->estado.PHP_EOL;
    echo '  Municipio: '.($notaria->municipio ?? 'N/A').PHP_EOL;
    echo '  Activa: '.($notaria->activa ? 'Sí' : 'No').PHP_EOL;
    echo PHP_EOL;

    // Suscripción activa
    $subscription = $notaria->activeSubscription;
    if ($subscription) {
        echo '✅ SUSCRIPCIÓN ACTIVA:'.PHP_EOL;
        echo '  Plan: '.$subscription->plan->name.PHP_EOL;
        echo '  Status: '.$subscription->status->value.PHP_EOL;
        echo '  Inicio: '.$subscription->start_date.PHP_EOL;
        echo '  Fin: '.$subscription->end_date.PHP_EOL;
        echo PHP_EOL;
    } else {
        echo '❌ No tiene suscripción activa'.PHP_EOL.PHP_EOL;
    }

    // Verificar BD tenant
    $estadoCodigo = \App\Enums\EstadoMexico::getCodeFromName($notaria->estado);
    $dbName = "atinet_{$estadoCodigo}_notaria_{$notaria->numero_notaria}";

    echo '=== BASE DE DATOS TENANT ==='.PHP_EOL;
    echo "  Nombre esperado: {$dbName}".PHP_EOL;

    // Verificar si existe
    $databases = DB::select("SHOW DATABASES LIKE '{$dbName}'");
    if (count($databases) > 0) {
        echo '  ✅ BD Existe'.PHP_EOL;

        // Configurar conexión temporal
        config(['database.connections.temp_tenant' => [
            'driver' => 'mysql',
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => $dbName,
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]]);

        // Contar usuarios en BD tenant
        try {
            $userCount = DB::connection('temp_tenant')->table('users')->count();
            echo "  Usuarios en BD: {$userCount}".PHP_EOL;

            if ($userCount > 0) {
                echo PHP_EOL.'=== USUARIOS EN BD TENANT ==='.PHP_EOL;
                $users = DB::connection('temp_tenant')->table('users')->get();
                foreach ($users as $user) {
                    echo "  - {$user->name} ({$user->email}) - Tipo: {$user->tipo_cuenta}".PHP_EOL;
                }
            }
        } catch (\Exception $e) {
            echo '  ⚠️  Error al consultar usuarios: '.$e->getMessage().PHP_EOL;
        }

    } else {
        echo '  ❌ BD NO existe'.PHP_EOL;
    }

} else {
    echo "❌ No se encontró ninguna notaría con 'prueba' en el nombre".PHP_EOL;
    echo PHP_EOL.'Listando todas las notarías:'.PHP_EOL;
    $notarias = Notaria::all();
    foreach ($notarias as $n) {
        echo "  - {$n->nombre} (ID: {$n->id}, Num: {$n->numero_notaria})".PHP_EOL;
    }
}

echo PHP_EOL;
