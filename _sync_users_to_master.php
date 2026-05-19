<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Users faltantes en master
$faltantes = App\Models\User::whereNotNull('notaria_id')
    ->whereNotIn('email', Illuminate\Support\Facades\DB::table('tbl_cat_usuarios')->pluck('Correo')->toArray())
    ->get();

echo 'Faltantes en tbl_cat_usuarios master: '.count($faltantes).PHP_EOL;

foreach ($faltantes as $user) {
    echo PHP_EOL."Sincronizando user_id={$user->id} email={$user->email}...".PHP_EOL;
    app(App\Observers\UserObserver::class)->created($user);
    echo '  Listo.'.PHP_EOL;
}

echo PHP_EOL.'=== Estado final tbl_cat_usuarios MASTER ==='.PHP_EOL;
$rows = Illuminate\Support\Facades\DB::table('tbl_cat_usuarios')
    ->whereNotIn('Usuario', ['LARAVEL_GW'])
    ->orderBy('Numero_Notaria')
    ->get();
foreach ($rows as $r) {
    echo "Id={$r->Id} Usuario={$r->Usuario} Correo={$r->Correo} Rol={$r->Rol_Id} Notaria={$r->Numero_Notaria}".PHP_EOL;
}
