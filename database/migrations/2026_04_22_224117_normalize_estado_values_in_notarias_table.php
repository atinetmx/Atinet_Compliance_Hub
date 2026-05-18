<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Normalizar nombres de estado para coincidir con SEPOMEX
        // SEPOMEX usa 'México', el enum tenía 'Estado de México'
        DB::table('notarias')
            ->where('estado', 'Estado de México')
            ->update(['estado' => 'México']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('notarias')
            ->where('estado', 'México')
            ->update(['estado' => 'Estado de México']);
    }
};
