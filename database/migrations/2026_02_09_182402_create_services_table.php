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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('Código único del servicio (ej: BLACKLIST_SAT)');
            $table->string('name')->comment('Nombre del servicio');
            $table->text('description')->nullable()->comment('Descripción del servicio');
            $table->string('category')->comment('Categoría: consulta, api, sistema, analisis, storage, integration');
            $table->string('billing_model')->comment('Modelo de facturación: included, limited, per_use, unlimited');
            $table->decimal('unit_price', 10, 2)->nullable()->comment('Precio por uso (nullable)');
            $table->boolean('is_active')->default(true)->comment('Servicio activo');
            $table->json('metadata')->nullable()->comment('Configuración adicional');
            $table->timestamps();

            // Índices
            $table->index('code');
            $table->index('category');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
