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
        Schema::create('cat_tipos_cliente', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique()->comment('Tipo de cliente/personalidad legal');
            $table->string('tipo', 20)->comment('fisica o moral');
            $table->string('descripcion', 255)->nullable()->comment('Descripción del tipo');
            $table->boolean('requiere_representante')->default(false)->comment('Si requiere representante legal');
            $table->boolean('requiere_razon_social')->default(false)->comment('Si requiere razón social');
            $table->boolean('activo')->default(true);
            $table->integer('orden')->default(0)->comment('Orden de visualización');
            $table->timestamps();

            // Índices
            $table->index('tipo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cat_tipos_cliente');
    }
};
