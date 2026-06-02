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
        if (Schema::hasTable('pep_paquetes_pld')) {
            return;
        }

        Schema::create('pep_paquetes_pld', function (Blueprint $table) {
            $table->id();

            // Identificación del paquete en PLD
            $table->string('nombre_plan')
                ->comment('Nombre del plan en PLD (ej: Plan 50, Plan 600)');

            // Búsquedas totales del paquete
            $table->unsignedInteger('total_busquedas')
                ->comment('Total de búsquedas reales compradas en este paquete');

            $table->unsignedInteger('busquedas_demo')->default(0)
                ->comment('Búsquedas DEMO incluidas en el plan (sin costo)');

            // Control de distribución interna (Atinet → notarías)
            $table->unsignedInteger('busquedas_asignadas')->default(0)
                ->comment('Total asignado a notarías clientes desde este paquete');

            // Período de vigencia del plan en PLD
            $table->date('periodo_inicio')
                ->comment('Inicio de vigencia del plan en PLD');

            $table->date('periodo_fin')->nullable()
                ->comment('Fin de vigencia del plan en PLD');

            $table->boolean('activo')->default(true)
                ->comment('true = paquete activo y en uso para nuevas asignaciones');

            $table->text('notas')->nullable()
                ->comment('Notas internas de Atinet sobre este paquete');

            $table->timestamps();

            $table->index('activo');
            $table->index('periodo_fin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pep_paquetes_pld');
    }
};
