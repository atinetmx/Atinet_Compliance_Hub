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
            // Campos geográficos normalizados
            $table->string('estado', 50)->nullable()->after('direccion');
            $table->string('municipio', 100)->nullable()->after('estado');
            $table->string('codigo_postal', 5)->nullable()->after('municipio');
            $table->string('colonia', 100)->nullable()->after('codigo_postal');
            $table->string('calle', 255)->nullable()->after('colonia');

            // Índices para búsquedas rápidas
            $table->index('estado');
            $table->index('municipio');
            $table->index('codigo_postal');

            // Nota: el campo 'direccion' se mantiene para compatibilidad temporal
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            $table->dropIndex(['estado']);
            $table->dropIndex(['municipio']);
            $table->dropIndex(['codigo_postal']);
            $table->dropColumn([
                'estado',
                'municipio',
                'codigo_postal',
                'colonia',
                'calle',
            ]);
        });
    }
};
