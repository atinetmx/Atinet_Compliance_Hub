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
            // Identificador de la notaría en el sistema legacy
            // Ej: "10Cuernavaca", "142etla", "9Acambaro"
            $table->string('legacy_identifier', 100)->nullable()->after('numero_notaria');

            // Estadísticas del sistema legacy (cache)
            $table->integer('legacy_busquedas_count')->nullable()->after('legacy_identifier');
            $table->timestamp('legacy_ultima_busqueda')->nullable()->after('legacy_busquedas_count');

            // Índice para búsquedas rápidas
            $table->index('legacy_identifier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            $table->dropIndex(['legacy_identifier']);
            $table->dropColumn([
                'legacy_identifier',
                'legacy_busquedas_count',
                'legacy_ultima_busqueda',
            ]);
        });
    }
};
