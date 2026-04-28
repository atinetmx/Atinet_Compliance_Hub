<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenants = [
    'atinet_edomex_notaria_10',
    'atinet_edomex_notaria_11',
    'atinet_mor_notaria_10',
    'atinet_oax_notaria_113',
    'atinet_edomex_notaria_60',
];

echo "Estado de BDs tenant:\n\n";
foreach ($tenants as $db) {
    $rows = DB::select('SELECT COUNT(table_name) as c FROM information_schema.tables WHERE table_schema=?', [$db]);
    $count = $rows[0]->c;
    $icon = $count >= 80 ? '✅' : '❌';
    echo "  {$icon} {$db}: {$count} tablas\n";
}
