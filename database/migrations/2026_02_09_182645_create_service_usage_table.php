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
        Schema::create('service_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notaria_id')->constrained('notarias')->cascadeOnDelete()->comment('Notaría');
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete()->comment('Servicio usado');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->comment('Usuario que lo usó');
            $table->timestamp('consumed_at')->comment('Timestamp del consumo');
            $table->integer('quantity')->default(1)->comment('Cantidad consumida');
            $table->decimal('cost', 10, 2)->default(0)->comment('Costo del consumo');
            $table->boolean('billable')->default(true)->comment('¿Se debe cobrar?');
            $table->timestamp('billed_at')->nullable()->comment('Fecha de facturación');
            $table->json('metadata')->nullable()->comment('Detalles del uso');
            $table->timestamp('created_at')->useCurrent()->comment('Fecha de creación');

            // Índices para performance
            $table->index('notaria_id');
            $table->index('consumed_at');
            $table->index('billable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_usage');
    }
};
