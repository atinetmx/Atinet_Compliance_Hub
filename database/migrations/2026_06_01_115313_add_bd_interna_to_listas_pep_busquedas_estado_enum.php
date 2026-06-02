<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Agrega el valor 'BD_INTERNA' al ENUM estado_busqueda.
     * Este estado indica que la búsqueda fue servida desde
     * listas_pep_personas (BD interna) sin consumir tokens de PLD.
     */
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE listas_pep_busquedas
            MODIFY COLUMN estado_busqueda
            ENUM('PENDIENTE','PROCESADA','BD_INTERNA','APROBADA','RECHAZADA')
            NOT NULL DEFAULT 'PROCESADA'
            COMMENT 'Estado: PROCESADA=online con token, BD_INTERNA=offline sin token'"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement(
            "ALTER TABLE listas_pep_busquedas
            MODIFY COLUMN estado_busqueda
            ENUM('PENDIENTE','PROCESADA','APROBADA','RECHAZADA')
            NOT NULL DEFAULT 'PROCESADA'
            COMMENT 'Estado del proceso de revisión de la búsqueda'"
        );
    }
};
