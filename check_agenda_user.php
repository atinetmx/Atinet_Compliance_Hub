<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Diagnóstico Agenda Usuario Legacy ===\n\n";

// 1. Buscar usuario
$email = 'admin@atinet.com.mx';
$user = User::where('email', $email)->first();

if (! $user) {
    echo "✗ Usuario '{$email}' no encontrado\n";
    exit(1);
}

echo "✓ Usuario encontrado:\n";
echo "  ID: {$user->id}\n";
echo "  Nombre: {$user->name}\n";
echo "  Email: {$user->email}\n";
echo "  Tipo: {$user->tipo_cuenta}\n";
echo '  Notaría ID: '.($user->notaria_id ?? 'NULL')."\n\n";

// 2. Verificar notaría
if ($user->notaria_id) {
    $notaria = DB::table('notarias')->find($user->notaria_id);
    if ($notaria) {
        echo "✓ Notaría:\n";
        echo "  ID: {$notaria->id}\n";
        echo "  Nombre: {$notaria->nombre}\n";
        echo '  Legacy ID: '.($notaria->legacy_identifier ?? 'NULL')."\n\n";
    }
}

// 3. Contar eventos totales en agenda_events
$totalEventos = AgendaEvent::count();
echo "Total eventos en agenda_events: {$totalEventos}\n\n";

// 4. Eventos del usuario
echo "--- Eventos del usuario {$user->id} ---\n";
$eventosUsuario = AgendaEvent::where('user_id', $user->id)->get();
echo "Total: {$eventosUsuario->count()}\n";
if ($eventosUsuario->isNotEmpty()) {
    foreach ($eventosUsuario as $e) {
        echo "  ID {$e->id}: {$e->titulo} | {$e->start_fecha} | {$e->color}\n";
    }
} else {
    echo "  (Sin eventos)\n";
}
echo "\n";

// 5. Si tiene notaría, eventos de la notaría
if ($user->notaria_id) {
    echo "--- Eventos de la notaría {$user->notaria_id} ---\n";
    $eventosNotaria = AgendaEvent::where('notaria_id', $user->notaria_id)->get();
    echo "Total: {$eventosNotaria->count()}\n";
    if ($eventosNotaria->isNotEmpty()) {
        foreach ($eventosNotaria->take(5) as $e) {
            echo "  ID {$e->id}: {$e->titulo} | User {$e->user_id} | {$e->start_fecha}\n";
        }
        if ($eventosNotaria->count() > 5) {
            echo '  ... y '.($eventosNotaria->count() - 5)." más\n";
        }
    } else {
        echo "  (Sin eventos)\n";
    }
    echo "\n";
}

// 6. Verificar query que usaría el controller
echo "--- Query simulada del controller ---\n";
$esAdmin = in_array($user->tipo_cuenta, ['super_admin', 'admin_notaria']);
echo 'Es admin: '.($esAdmin ? 'Sí' : 'No')."\n";

$query = AgendaEvent::query();

if ($esAdmin && $user->notaria_id) {
    $query->where('notaria_id', $user->notaria_id);
} elseif (! $esAdmin) {
    $query->where('user_id', $user->id);
}

$resultados = $query->get();
echo "Eventos que vería: {$resultados->count()}\n";
if ($resultados->isNotEmpty()) {
    foreach ($resultados->take(3) as $e) {
        echo "  - {$e->titulo} ({$e->start_fecha})\n";
    }
}

echo "\n=== Fin del diagnóstico ===\n";
