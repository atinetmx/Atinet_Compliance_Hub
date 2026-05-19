<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$cols = DB::select('SHOW COLUMNS FROM notarias');
foreach ($cols as $c) {
    echo "{$c->Field} ({$c->Type}) null={$c->Null} default=".var_export($c->Default, true)."\n";
}

echo "\n--- Una notaría de muestra ---\n";
$sample = DB::table('notarias')->first();
echo json_encode((array) $sample, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
