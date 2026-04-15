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
        Schema::create('municipios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estado_id')->constrained('estados')->cascadeOnDelete()->comment('Estado al que pertenece');
            $table->string('nombre', 100)->comment('Nombre del municipio');
            $table->string('codigo_sepomex', 3)->comment('Código SEPOMEX del municipio');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Índices
            $table->index(['estado_id', 'nombre']);
            $table->unique(['estado_id', 'codigo_sepomex']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('municipios');
    }
};
