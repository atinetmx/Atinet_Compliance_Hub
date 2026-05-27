<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== ESTRUCTURA DE LA TABLA NOTARIAS ===\n";
$columns = DB::select("DESCRIBE notarias");

foreach ($columns as $col) {
    echo "{$col->Field} | {$col->Type} | Null:{$col->Null} | Default:{$col->Default}\n";
}
