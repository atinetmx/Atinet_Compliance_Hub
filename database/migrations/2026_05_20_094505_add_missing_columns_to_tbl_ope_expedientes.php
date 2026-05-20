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
        Schema::table('tbl_ope_expedientes', function (Blueprint $table) {
            // Columna nueva de Alex: índice de operación, se ubica después de Fecha_Firma_Todos
            $table->string('Operacion_Indices', 255)->nullable()->after('Fecha_Firma_Todos');

            // Columna nueva de Alex: FK al presupuesto asociado, se ubica después de Motivo
            $table->integer('Presupuesto_Id')->nullable()->after('Motivo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_ope_expedientes', function (Blueprint $table) {
            $table->dropColumn(['Operacion_Indices', 'Presupuesto_Id']);
        });
    }
};
