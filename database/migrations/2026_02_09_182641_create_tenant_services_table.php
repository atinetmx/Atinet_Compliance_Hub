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
        Schema::create('tenant_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('notarias')->cascadeOnDelete()->comment('Notaría');
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete()->comment('Servicio');
            $table->boolean('is_enabled')->default(true)->comment('Servicio activo');
            $table->integer('custom_limit')->nullable()->comment('Límite personalizado');
            $table->decimal('custom_price', 10, 2)->nullable()->comment('Precio personalizado');
            $table->date('activation_date')->nullable()->comment('Fecha de activación');
            $table->date('expiration_date')->nullable()->comment('Fecha de expiración');
            $table->text('notes')->nullable()->comment('Observaciones');
            $table->timestamps();

            // Índice único compuesto para evitar duplicados
            $table->unique(['tenant_id', 'service_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_services');
    }
};
