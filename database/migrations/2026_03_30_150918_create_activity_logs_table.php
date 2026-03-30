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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->foreignId('notaria_id')->nullable()->constrained('notarias')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');

            // Información de la acción
            $table->string('accion', 255); // Descripción de la acción (ej: "Creó evento de agenda")
            $table->string('modulo', 50)->nullable(); // Módulo (ej: "Agenda", "Listas Negras", "Suscripciones")
            $table->string('modelo', 100)->nullable(); // Modelo Laravel afectado (ej: "AgendaEvent", "Busqueda")
            $table->unsignedBigInteger('modelo_id')->nullable(); // ID del registro afectado

            // Datos adicionales (JSON)
            $table->json('propiedades')->nullable(); // Datos antes/después, metadatos, etc.

            // Información del request
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();

            // Timestamps
            $table->timestamps();

            // Índices para búsquedas rápidas
            $table->index(['notaria_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['modulo', 'created_at']);
            $table->index('modelo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
