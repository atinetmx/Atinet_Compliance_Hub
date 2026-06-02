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
        if (Schema::hasTable('listas_pep_resultados') && ! Schema::hasColumn('listas_pep_resultados', 'relaciones')) {
            Schema::table('listas_pep_resultados', function (Blueprint $table) {
                // Campo visible en prevenciondelavado.com para tipo AFIN PEP/AFIN EX PEP
                // Ejemplo: "Hijos de ROSALIA ELVIA PEREZ PEREZ (PEFR611575U8)"
                // Se inserta después de otra_identificacion para mantener coherencia semántica
                $table->text('relaciones')->nullable()
                    ->after('otra_identificacion')
                    ->comment('Relaciones familiares o políticas con el PEP. Solo aplica para AFIN PEP y AFIN EX PEP');

                $table->index('relaciones', 'idx_listas_pep_resultados_relaciones');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('listas_pep_resultados') && Schema::hasColumn('listas_pep_resultados', 'relaciones')) {
            Schema::table('listas_pep_resultados', function (Blueprint $table) {
                $table->dropIndex('idx_listas_pep_resultados_relaciones');
                $table->dropColumn('relaciones');
            });
        }
    }
};
