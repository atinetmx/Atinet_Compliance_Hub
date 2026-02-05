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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->text('descripcion')->nullable();
            $table->decimal('precio_mensual', 10, 2)->nullable();
            $table->decimal('precio_anual', 10, 2)->nullable();
            $table->integer('limite_usuarios')->default(-1); // -1 = ilimitado
            $table->integer('limite_busquedas_mes')->default(-1); // -1 = ilimitado
            $table->json('herramientas_activas')->nullable(); // ['ofac', 'sat', 'cruzada']
            $table->json('caracteristicas')->nullable(); // Lista de características del plan
            $table->boolean('is_active')->default(true);
            $table->integer('orden')->default(0); // Para ordenar planes en UI
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('orden');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
