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
        Schema::create('seguimientos_atencion', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnDelete()
                ->comment('Cliente al que se le da seguimiento (era "expediente" en VB)');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()
                ->comment('Usuario que registró el seguimiento');

            // Contenido
            $table->text('concepto')->comment('Descripción del seguimiento/contacto');
            $table->dateTime('fecha_contacto')->comment('Fecha y hora del contacto');

            // Clasificación
            $table->enum('tipo_contacto', ['llamada', 'email', 'whatsapp', 'presencial', 'otro'])
                ->default('llamada');
            $table->enum('resultado', ['exitoso', 'sin_respuesta', 'pendiente', 'otro'])
                ->default('exitoso');

            // Auditoría
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['cliente_id', 'fecha_contacto']);
            $table->index(['user_id', 'fecha_contacto']);
            $table->index('fecha_contacto');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seguimientos_atencion');
    }
};
