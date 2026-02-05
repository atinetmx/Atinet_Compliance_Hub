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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notaria_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->date('fecha_inicio');
            $table->date('fecha_vencimiento');
            $table->enum('status', ['activa', 'vencida', 'cancelada', 'suspendida', 'trial'])
                  ->default('activa');
            $table->string('metodo_pago')->nullable(); // stripe, paypal, transferencia
            $table->decimal('precio_pagado', 10, 2);
            $table->string('moneda', 3)->default('MXN');
            $table->enum('ciclo_facturacion', ['mensual', 'anual'])->default('mensual');
            $table->boolean('auto_renovacion')->default(true);
            $table->timestamp('fecha_cancelacion')->nullable();
            $table->string('razon_cancelacion')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['notaria_id', 'status']);
            $table->index('fecha_vencimiento');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
