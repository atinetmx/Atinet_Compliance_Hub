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
        Schema::create('estados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->comment('Nombre del estado (ej: Sonora, Jalisco)');
            $table->string('codigo_sepomex', 2)->unique()->comment('Código SEPOMEX (ej: 26 = Sonora)');
            $table->string('abreviatura', 10)->nullable()->comment('Abreviatura (ej: SON, JAL)');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Índices
            $table->index('nombre');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estados');
    }
};
