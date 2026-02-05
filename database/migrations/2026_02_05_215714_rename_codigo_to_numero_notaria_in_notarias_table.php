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
        Schema::table('notarias', function (Blueprint $table) {
            // Renombrar la columna 'codigo' a 'numero_notaria'
            $table->renameColumn('codigo', 'numero_notaria');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            // Revertir el cambio - renombrar de vuelta a 'codigo'
            $table->renameColumn('numero_notaria', 'codigo');
        });
    }
};
