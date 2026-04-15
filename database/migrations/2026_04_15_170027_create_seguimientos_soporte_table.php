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
        Schema::create('seguimientos_soporte', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnDelete()
                ->comment('Cliente que solicitó soporte');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()
                ->comment('Técnico asignado');

            // Contenido
            $table->text('concepto')->comment('Descripción del problema/soporte');
            $table->dateTime('fecha_soporte')->comment('Fecha y hora del soporte');

            // Clasificación
            $table->enum('tipo_soporte', ['tecnico', 'capacitacion', 'consulta', 'instalacion', 'actualizacion', 'otro'])
                ->default('tecnico');
            $table->enum('estado', ['abierto', 'en_proceso', 'resuelto', 'cerrado'])
                ->default('abierto');
            $table->enum('prioridad', ['baja', 'media', 'alta', 'critica'])->default('media');

            // Resolución
            $table->text('solucion')->nullable()->comment('Descripción de la solución');
            $table->timestamp('fecha_resolucion')->nullable();

            // Auditoría
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['cliente_id', 'estado']);
            $table->index(['user_id', 'fecha_soporte']);
            $table->index(['estado', 'prioridad']);
            $table->index('fecha_soporte');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seguimientos_soporte');
    }
};
