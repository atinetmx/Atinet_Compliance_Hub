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
        Schema::create('plan_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete()->comment('Plan al que pertenece');
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete()->comment('Servicio incluido');
            $table->boolean('is_included')->default(true)->comment('¿Incluido en el plan?');
            $table->integer('usage_limit')->nullable()->comment('Límite de uso (null = ilimitado)');
            $table->decimal('extra_price', 10, 2)->nullable()->comment('Precio por uso extra');
            $table->integer('priority')->default(0)->comment('Orden de visualización');
            $table->timestamps();

            // Índice único compuesto para evitar duplicados
            $table->unique(['plan_id', 'service_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_services');
    }
};
