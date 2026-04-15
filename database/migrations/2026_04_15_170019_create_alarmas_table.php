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
        Schema::create('alarmas', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->cascadeOnDelete()
                ->comment('Cliente relacionado (era "Expediente" en VB)');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()
                ->comment('Usuario asignado');

            // Datos de la alarma
            $table->string('concepto', 500)->comment('Concepto/título de la alarma');
            $table->text('descripcion')->nullable()->comment('Descripción detallada');
            $table->date('fecha_alarma')->comment('Fecha programada de la alarma');
            $table->time('hora_alarma')->nullable()->comment('Hora de la alarma');

            // Estado
            $table->enum('estado', ['pendiente', 'completada', 'cancelada'])->default('pendiente');
            $table->enum('prioridad', ['baja', 'media', 'alta', 'urgente'])->default('media');
            $table->boolean('notificada')->default(false)->comment('Si ya se notificó al usuario');
            $table->timestamp('fecha_notificacion')->nullable();
            $table->timestamp('fecha_completada')->nullable();

            // Auditoría
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['user_id', 'fecha_alarma', 'estado']);
            $table->index(['cliente_id', 'estado']);
            $table->index('fecha_alarma');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alarmas');
    }
};
