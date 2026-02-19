<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('busquedas', function (Blueprint $table) {
            // Hacer nullable para permitir búsquedas de super admins (sin notaría asignada)
            $table->foreignId('notaria_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('busquedas', function (Blueprint $table) {
            $table->foreignId('notaria_id')->nullable(false)->change();
        });
    }
};
