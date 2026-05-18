<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== agenda_events: muestra de 3 registros ===\n";
$sample = DB::table('agenda_events')->limit(3)->get();
foreach ($sample as $e) {
    echo "  id={$e->id} notaria_id={$e->notaria_id} user_id=" . ($e->user_id ?? 'NULL');
    echo " legacy_notaria={$e->legacy_notaria}";
    echo " start={$e->start_fecha}\n";
}

echo "\n=== notaria_id de los eventos ===\n";
DB::table('agenda_events')
    ->selectRaw('notaria_id, COUNT(*) as total')
    ->groupBy('notaria_id')
    ->get()
    ->each(fn($r) => print("  notaria_id=" . ($r->notaria_id ?? 'NULL') . ": {$r->total}\n"));

echo "\n=== notarías con legacy_identifier ===\n";
DB::table('notarias')->whereNotNull('legacy_identifier')
    ->select('id', 'nombre', 'legacy_identifier')
    ->get()
    ->each(fn($n) => print("  id={$n->id} legacy={$n->legacy_identifier} nombre={$n->nombre}\n"));

echo "\n=== Usuarios super_admin sin notaria_id ===\n";
$users = DB::table('users')->where('tipo_cuenta', 'super_admin')->whereNull('notaria_id')
    ->select('id', 'name', 'tipo_cuenta', 'notaria_id')->get();
foreach ($users as $u) {
    echo "  id={$u->id} name={$u->name} tipo={$u->tipo_cuenta} notaria_id=" . ($u->notaria_id ?? 'NULL') . "\n";
}

echo "\n=== Scope visiblePara para cada super_admin ===\n";
foreach ($users as $u) {
    $user = \App\Models\User::find($u->id);
    $todos = \App\Models\AgendaEvent::visiblePara($user, 'todos')->count();
    $propio = \App\Models\AgendaEvent::visiblePara($user, 'propio')->count();
    echo "  {$u->name}: todos={$todos}, propio={$propio}\n";
}

echo "\n=== SQL del scope (primer super_admin) ===\n";
$firstAdmin = \App\Models\User::where('tipo_cuenta', 'super_admin')->whereNull('notaria_id')->first();
if ($firstAdmin) {
    $sql = \App\Models\AgendaEvent::visiblePara($firstAdmin, 'todos')->toSql();
    echo $sql . "\n";
    echo "Bindings: " . implode(', ', \App\Models\AgendaEvent::visiblePara($firstAdmin, 'todos')->getBindings()) . "\n";
}
